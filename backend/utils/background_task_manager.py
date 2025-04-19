import logging
import threading
from typing import Any, Callable, Dict, Optional
from datetime import datetime

class BackgroundTaskManager:
    _instance = None
    _lock = threading.Lock() # use lock to avoid race condition

    def __new__(cls): # singleton pattern
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        """Initialize the singleton instance"""
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.task_results: Dict[str, Any] = {}

    def run_task(self, task_id: str, target: Callable, args: tuple = (), kwargs: dict = None, callback: Optional[Callable] = None) -> None:
        """
        Run a task in the background.
        Args:
            task_id: Unique identifier for the task
            target: Function to run
            args: Arguments for the target function
            kwargs: Keyword arguments for the target function
            callback: Optional callback function to run after task completion
        """
        if kwargs is None:
            kwargs = {}

        def wrapped_target(*args, **kwargs):
            try:
                # Execute the target function
                result = target(*args, **kwargs)
                
                # Store the result
                self.task_results[task_id] = {
                    'status': 'completed',
                    'result': result,
                    'completed_at': datetime.utcnow().isoformat()
                }
                
                # Execute callback if provided
                if callback:
                    callback(task_id, result)
                    
            except Exception as e:
                logging.error(f"Error in background task {task_id}: {str(e)}")
                self.task_results[task_id] = {
                    'status': 'failed',
                    'error': str(e),
                    'completed_at': datetime.utcnow().isoformat()
                }
                raise
            finally:
                # Clean up task entry
                if task_id in self.tasks:
                    del self.tasks[task_id]

        # Create and start the thread to run the task
        thread = threading.Thread(target=wrapped_target, args=args, kwargs=kwargs)
        thread.daemon = True # Thread will be terminated when the main thread terminates

        # Store task information
        self.tasks[task_id] = {
            'thread': thread,
            'started_at': datetime.utcnow().isoformat(),
            'status': 'running'
        }

        # Start the thread
        thread.start()

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a task"""
        # Check if task is still running
        if task_id in self.tasks:
            return {
                'status': 'running',
                'started_at': self.tasks[task_id]['started_at']
            }
        
        # Check if task has completed or failed
        if task_id in self.task_results:
            return self.task_results[task_id]
            
        return {'status': 'not_found'} 