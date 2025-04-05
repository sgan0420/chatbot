import logging
import os
import tempfile
import uuid

from config import get_supabase_client
from dotenv import load_dotenv
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.prompts.chat import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate

from langchain.vectorstores import FAISS
from models.request.chat_request import ChatRequest, CreateSessionRequest, GetChatHistoryRequest
from models.response.chat_response import ChatResponse, CreateSessionResponse, ChatSessionListResponse
from models.response.response_wrapper import ErrorResponse, SuccessResponse
from services.facade.chat_service import ChatService
from supabase import Client

BUCKET_NAME = "DOCUMENTS"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ChatServiceImpl(ChatService):
    def __init__(self, user_token = None):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Please set OPENAI_API_KEY in the .env file")
        self.supabase = get_supabase_client(user_token)
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = None
        self.conversation_chain = None
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)


    def _load_vector_store_from_supabase(self, user_id: str, chatbot_id: str, supabase: Client):
        """Load vector store from Supabase URLs"""
        # There are two files saved, index.faiss and index.pkl
        # index.faiss: contains the actual vector embeddings, stores the numerical vectors in FAISS's optimized format, used for similarity searching.
        # index.pkl: contains the metadata and mapping information, stores the original texts and their metadata, maps vectors back to their original content.
        # .faiss is "search engine" part and .pkl is lookup table.
        # index.faiss:
        # [0.1, 0.2, 0.3, ...] -> Vector ID: 1
        # [0.4, 0.5, 0.6, ...] -> Vector ID: 2
        # [0.7, 0.8, 0.9, ...] -> Vector ID: 3
        # index.pkl:
        # Vector ID: 1 -> {"text": "This is the first document", "source": "doc1.pdf"}
        # Vector ID: 2 -> {"text": "This is the second document", "source": "doc2.pdf"}
        # Vector ID: 3 -> {"text": "This is the third document", "source": "doc3.pdf"}

        # Without .faiss, you can't perform similarity searches
        # Without .pkl, you can't retrieve the original content that matches the vectors
        try:
            storage_faiss_path = f"{user_id}/{chatbot_id}/rag-vector/index.faiss"
            storage_pkl_path = f"{user_id}/{chatbot_id}/rag-vector/index.pkl"

            # Create a temporary directory
            # FAISS needs actual files on disk because:
            # 1. It memory-maps the index file (.faiss) for efficient similarity searches
            # 2. It uses Python's pickle module to load the metadata (.pkl)
            with tempfile.TemporaryDirectory() as temp_dir:
                # Download files directly from Supabase bucket
                faiss_data = supabase.storage.from_(BUCKET_NAME).download(storage_faiss_path)
                pkl_data = supabase.storage.from_(BUCKET_NAME).download(storage_pkl_path)
                
                faiss_path = os.path.join(temp_dir, "index.faiss")
                pkl_path = os.path.join(temp_dir, "index.pkl")
                
                # Save files temporarily
                with open(faiss_path, 'wb') as f:
                    f.write(faiss_data)
                with open(pkl_path, 'wb') as f:
                    f.write(pkl_data)
                
                # Load vector store from temporary files
                self.vector_store = FAISS.load_local(temp_dir, self.embeddings)
                self._initialize_conversation_chain()
                
        except Exception as e:
            logging.error(f"Error loading vector store from Supabase: {str(e)}")
            raise


    def _initialize_conversation_chain(self):
        if self.vector_store:
            # Define your custom system template
            system_template = """
            You are a helpful AI assistant. Use the following pieces of context to answer the user's questions.
            Always try to answer the question based on the context (the documents/vectors you have access to) and the current conversation.
            If the context given is not relevant to the question, and the question is general, just answer it based on your knowledge.
            If the context given is not relevant to the question, and the question is specific, just notify the user to be more specific.
            You must reply in English all the time.
            
            When answering questions about tables, format the information clearly:
            1. For simple lookups, present the specific cell values requested
            2. For summarizing table data, organize information by rows or columns
            3. When presenting tabular data, keep the original structure where appropriate
            4. If the table has column headers, use them in your explanations
            
            Context: {context}
            
            Current conversation:
            {chat_history}
            """
            
            # Create prompt templates
            system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
            human_template = "{question}"
            human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
            
            chat_prompt = ChatPromptTemplate.from_messages([
                system_message_prompt,
                human_message_prompt,
            ])
            
            # Configure advanced retrieval parameters to improve table retrieval
            retriever = self.vector_store.as_retriever(
                search_type="mmr",  # Use Maximum Marginal Relevance for greater result diversity
                search_kwargs={
                    "k": 5,  # Retrieve more documents to increase chance of getting relevant tables
                    "fetch_k": 10,  # Consider more candidates before selecting final results
                    "lambda_mult": 0.7  # Balance between relevance and diversity (0.7 favors relevance)
                }
            )
            
            self.conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=ChatOpenAI(temperature=0.7, model_name="gpt-4o-mini"),
                retriever=retriever,
                memory=self.memory,
                combine_docs_chain_kwargs={"prompt": chat_prompt},
                verbose=True
            )
            logging.info("Conversation chain initialization completed")
        else:
            logging.error("Cannot initialize chain without vector store")


    def _load_conversation_memory(self, chatbot_id: str, session_id: str, supabase: Client):
        """Load previous conversations into memory"""
        try:
            # Get user messages
            user_result = supabase.table('chats') \
                .select('message') \
                .eq('chatbot_id', chatbot_id) \
                .eq('session_id', session_id) \
                .eq('user_type', 'user') \
                .order('created_at') \
                .execute()

            # Get AI messages
            ai_result = supabase.table('chats') \
                .select('message') \
                .eq('chatbot_id', chatbot_id) \
                .eq('session_id', session_id) \
                .eq('user_type', 'bot') \
                .order('created_at') \
                .execute()
            
            if not (user_result.data or ai_result.data):
                logging.info("No conversation history found for this chat")
            else:
                # Add messages to memory
                # LangChain API's add_user_message and add_ai_message methods only accept one message at a time. 
                for msg in user_result.data:
                    self.memory.chat_memory.add_user_message(msg['message'])
                for msg in ai_result.data:
                    self.memory.chat_memory.add_ai_message(msg['message'])
                    
                total_messages = len(user_result.data) + len(ai_result.data)
                logging.info(f"Loaded {total_messages} messages into conversation memory")
        except Exception as e:
            logging.error(f"Error loading conversation memory: {str(e)}")
            # Fall back to empty memory
            self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)


    def _save_message(self, chatbot_id: str, session_id: str, is_user: bool, message: str, supabase: Client):
        """Save a message to the chats table """
        try:
            # add a new row to the chats table
            supabase.table('chats').insert({
                'id': str(uuid.uuid4()),
                'chatbot_id': chatbot_id,
                'session_id': session_id,
                'user_type': 'user' if is_user else 'bot',
                'message': message,
            }).execute()
            logging.info(f"Saved {'user' if is_user else 'AI'} message to chat session {session_id}")
        except Exception as e:
            logging.error(f"Error saving message to chat session {session_id}: {str(e)}")
            raise  # Re-raise to handle in the calling function


    def create_session(self, data: CreateSessionRequest) -> tuple[dict, int]:
        """Create a new chat session"""
        try:
            chatbot_id = data.chatbot_id
            session_id = str(uuid.uuid4())

            # Check if the chatbot exists and has a vector store
            result = self.supabase.table('documents') \
                .select('*') \
                .eq('chatbot_id', chatbot_id) \
                .eq('file_type', 'faiss') \
                .maybe_single() \
                .execute()
                
            if result == None:
                return ErrorResponse(
                    message="No vector store found for this chatbot. Please process documents first."
                ).model_dump(), 400

            # Create a new session
            session_data = {
                'id': session_id,
                'chatbot_id': chatbot_id,
            }
            
            self.supabase.table('chat_sessions').insert(session_data).execute()
            
            return SuccessResponse(
                data=CreateSessionResponse(
                    session_id=session_id
                ).model_dump(),
                message="Chat session created successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error creating chat session: {str(e)}")
            return ErrorResponse(
                message="Failed to create chat session"
            ).model_dump(), 500
        
    def delete_session(self, chatbot_id: str, session_id: str) -> tuple[dict, int]:
        """Delete a chat session"""
        try:
            result = self.supabase.table('chat_sessions') \
                .delete() \
                .eq('id', session_id) \
                .eq('chatbot_id', chatbot_id) \
                .execute()
            return SuccessResponse(
                message="Chat session deleted successfully"
            ).model_dump(), 200
        except Exception as e:
            logging.error(f"Error deleting chat session {session_id}: {str(e)}")
            return ErrorResponse(
                message="Failed to delete chat session"
            ).model_dump(), 500

    def get_sessions(self, chatbot_id: str) -> tuple[dict, int]:
        """Get all chat sessions for a user"""
        try:
            response = (
                self.supabase.table('chat_sessions') 
                .select('*') 
                .eq("chatbot_id", chatbot_id)
                .execute()
            )

            logging.info(f"Retrieved {len(response.data)} chat sessions")
            session_list_response = ChatSessionListResponse(
                sessions=response.data)
            logging.info("Chat sessions retrieved successfully")
            
            return SuccessResponse(
                data=session_list_response.model_dump(),
                message="Chat sessions retrieved successfully"
            ).model_dump(), 200
        
        except Exception as e:
            logging.error(f"Error retrieving chat sessions: {str(e)}")
            return ErrorResponse(
                message="Failed to retrieve chat sessions"
            ).model_dump(), 500

    def chat(self, user_id: str, user_token: str, data: ChatRequest) -> tuple[dict, int]:
        """Process user query and return response"""
        supabase = get_supabase_client(user_token)
        chatbot_id = data.chatbot_id
        session_id = data.session_id
        query = data.query
        # Check if vector store exists in Supabase
        try:
            result = supabase.table('documents') \
                .select('*') \
                .eq('chatbot_id', chatbot_id) \
                .eq('file_type', 'faiss') \
                .single() \
                .execute()
            # If no result, skip loading
            if not result.data:
                logging.info("No existing vector store found for this chatbot")
                return ErrorResponse(
                    message="No vector store found for this chatbot"
                ).model_dump(), 400
            else:
                self._load_vector_store_from_supabase(user_id, chatbot_id, supabase)
                logging.info("Successfully loaded existing vector store from Supabase")
                self._load_conversation_memory(chatbot_id, session_id, supabase)
                logging.info("Successfully loaded existing conversation history from Supabase")
        except Exception as e:
            logging.error(f"Failed to load existing vector store or conversation history: {str(e)}")

        try:
            # Save user message first
            self._save_message(chatbot_id, session_id, True, query, supabase)
            
            # Get AI response
            result = self.conversation_chain({"question": query})
            answer = result.get("answer", "Sorry, I couldn't find relevant information.")
            
            self._save_message(chatbot_id, session_id, False, answer, supabase)

            return SuccessResponse(
                data=ChatResponse(
                    answer=answer
                ).model_dump(),
                message="Chat response generated successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error processing query: {str(e)}")
            return ErrorResponse(
                message="An error occurred while processing your request"
            ).model_dump(), 500


    def get_chat_history(self, user_token: str, data: GetChatHistoryRequest) -> tuple[dict, int]:
        """Get chat history for a specific chat session"""
        supabase = get_supabase_client(user_token)
        chatbot_id = data.chatbot_id
        session_id = data.session_id
        try:
            result = supabase.table('chats') \
                .select('message') \
                .eq('chatbot_id', chatbot_id) \
                .eq('session_id', session_id) \
                .execute()

            if not result.data:
                return SuccessResponse(
                    data={"messages": []},
                    message="No chat history found"
                ).model_dump(), 200

            return SuccessResponse(
                data={"messages": result.data},
                message="Chat history retrieved successfully"
            ).model_dump(), 200
        except Exception as e:
            logging.error(f"Error retrieving chat history: {str(e)}")
            return ErrorResponse(
                message=str(e)
            ).model_dump(), 500