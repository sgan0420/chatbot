import pdfplumber
import re

class PDFProcessor:
    def __init__(self, file_path):
        self.file_path = file_path
        # store the table numbers that have been processed (used for skipping table that is a continuation of a table from the previous page)
        self.processed_tables = set()
        self.content_per_page = {}

    # =======================================================================
    # Helper functions for extracting text from tables in the current page
    # =======================================================================

    def _is_table_continued(self, table1, table2):
        """Check if table2 is a continuation of table1."""
        # Check if tables have the same number of columns
        if len(table1[0]) != len(table2[0]):
            # print("TABLES HAVE DIFFERENT NUMBER OF COLUMNS, SO THEY ARE NOT CONTINUATIONS")
            return False
        
        # Get the last row of table1 and the first row of table2
        table1_last_row = table1[-1]
        table2_first_row = table2[0]
        
        # Compare data types and structure
        try:
            # Check if each column has matching data types
            for col1, col2 in zip(table1_last_row, table2_first_row):
                # Handle None/empty values
                if col1 is None or col2 is None:
                    continue
                    
                # Convert to string for comparison if not None
                col1_str = str(col1).strip()
                col2_str = str(col2).strip()
                
                # Check if both are numeric
                col1_is_numeric = col1_str.isdigit()
                col2_is_numeric = col2_str.isdigit()
                if col1_is_numeric != col2_is_numeric:
                    # print("TABLES HAVE DIFFERENT DATA TYPES (ONE IS NUMERIC AND THE OTHER IS NOT), SO THEY ARE NOT CONTINUATIONS")
                    return False
                
                date_patterns = [
                    r'^\d{4}[-/]\d{1,2}[-/]\d{1,2}$',  # YYYY-MM-DD or YYYY/MM/DD
                    r'^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$', # MM/DD/YYYY or DD/MM/YYYY
                ]

                # Check if both are dates
                col1_is_date = any(re.match(pattern, col1_str) for pattern in date_patterns)
                col2_is_date = any(re.match(pattern, col2_str) for pattern in date_patterns)
                if col1_is_date != col2_is_date:
                    # print("TABLES HAVE DIFFERENT DATA TYPES (ONE IS DATE AND THE OTHER IS NOT), SO THEY ARE NOT CONTINUATIONS")
                    return False
        except (IndexError, AttributeError):
            return False
        
        return True

    def _merge_tables(self, table1, table2):
        """Merge two tables, handling repeated headers."""
        # If the second table starts with the same headers, skip them
        merged = table1 + (table2[1:] if table1[0] == table2[0] else table2)
        # Apply row merging to the combined table
        return self._format_table(merged)

    def _format_table(self, table):
        """
        Original Table in PDF:
        +----------------+------------------+-------------+
        | Product Name   | Description      | Price       |
        +----------------+------------------+-------------+
        | Super Deluxe   | This is a long  | $99.99      |
        | Widget         | description that |             |
        |                | spans multiple   |             |
        |                | lines           |             |
        +----------------+------------------+-------------+
        | Basic Widget   | Simple widget   | $49.99      |
        +----------------+------------------+-------------+

        Raw Extracted Data (before _format_table):
        Row 1: ["Super Deluxe", "This is a long", "$99.99"]
        Row 2: ["Widget", "description that", ""]
        Row 3: ["", "spans multiple", ""]
        Row 4: ["", "lines", ""]
        Row 5: ["Basic Widget", "Simple widget", "$49.99"]

        After _format_table:
        Row 1: ["Super Deluxe Widget", "This is a long description that spans multiple lines", "$99.99"]
        Row 2: ["Basic Widget", "Simple widget", "$49.99"]
        """
        merged_table = [table[0]]  # Keep the header row
        i = 1
        while i < len(table):
            current_row = table[i]
            
            # Check if next row might be a continuation
            if i + 1 < len(table):
                next_row = table[i + 1]
                
                # Count empty cells in next row
                empty_cells = sum(1 for cell in next_row if cell == '')
                
                # If most cells are empty in next row, it might be a continuation
                if empty_cells >= len(next_row) - 2:
                    merged_row = []
                    for j in range(len(current_row)):
                        # If next row's cell is empty, use current row's cell
                        # Otherwise, merge the content
                        if not next_row[j]:
                            merged_row.append(current_row[j])
                        elif not current_row[j]:
                            merged_row.append(next_row[j])
                        else:
                            # Merge content, handling newlines
                            merged_content = (current_row[j].replace('\n', ' ') + ' ' + 
                                           next_row[j].replace('\n', ' ')).strip()
                            merged_row.append(merged_content)
                    
                    merged_table.append(merged_row)
                    i += 2  # Skip the next row since we merged it
                    continue
            
            merged_table.append(current_row)
            i += 1
        
        return merged_table

    def _extract_table(self, page_num, table_num):
        """Extract a specific table from a page and check for continuation."""
        try:
            with pdfplumber.open(self.file_path) as pdf:
                if page_num >= len(pdf.pages):
                    return None
                    
                table_page = pdf.pages[page_num]
                tables = table_page.extract_tables()
                
                # Safety check for table number
                if not tables or table_num >= len(tables):
                    return None
                    
                # Obtain the current table
                current_table = tables[table_num]
                
                # Safety check for empty table
                if not current_table or len(current_table) == 0:
                    return None
                
                # Check if the current table continues on next page
                # 0. make sure the current table is the last table of the page so there is chance for continuation
                if table_num == len(tables)-1:
                    # 1. check if there are still pages left
                    if page_num + 1 < len(pdf.pages):
                        next_page = pdf.pages[page_num + 1]
                        next_page_tables = next_page.extract_tables()
                        # 2. check if the next page has tables
                        if next_page_tables and len(next_page_tables) > 0:
                            # 3. check if the current table continues on the next page
                            if self._is_table_continued(current_table, next_page_tables[0]):
                                # 4. Recursively extract and merge with continuation
                                continuation = self._extract_table(page_num + 1, 0)
                                if continuation:
                                    self.processed_tables.add((page_num + 1, 0))
                                    # 5. merge the current table with the continuation
                                    return self._merge_tables(current_table, continuation)
                
                # Merge split rows within the table
                return self._format_table(current_table)
        except Exception as e:
            print(f"Error extracting table from page {page_num}, table {table_num}: {str(e)}")
            return None

    def _table_converter(self, table):
        """Convert table into a formatted string."""
        table_string = ''
        for row in table:
            # Clean row data and handle None values
            cleaned_row = [item.replace('\n', ' ') if item is not None and '\n' in item 
                          else 'None' if item is None else item for item in row]
            # Convert the table into a string
            table_string += ('|' + '|'.join(cleaned_row) + '|' + '\n')
        return table_string.rstrip()

    # =======================================================================
    # Helper functions for extracting pure text from the current page
    # =======================================================================

    def _curves_to_edges(self, cs):
        """Convert curves to edges."""
        edges = []
        for c in cs:
            edges += pdfplumber.utils.rect_to_edges(c)
        return edges

    def _get_table_settings(self, page):
        """Get settings for table detection using multiple strategies."""
        # First try to get explicit lines from curves and edges
        vertical_lines = self._curves_to_edges(page.curves + page.edges)
        horizontal_lines = self._curves_to_edges(page.curves + page.edges)
        
        # If we have enough lines, use explicit strategy
        if len(vertical_lines) >= 2 and len(horizontal_lines) >= 2:
            return {
                "vertical_strategy": "explicit",
                "horizontal_strategy": "explicit",
                "explicit_vertical_lines": vertical_lines,
                "explicit_horizontal_lines": horizontal_lines,
                "intersection_y_tolerance": 10,
            }
        
        # Fallback to text-based strategy if not enough lines
        return {
            "vertical_strategy": "text",
            "horizontal_strategy": "text",
            "intersection_y_tolerance": 10,
            "snap_tolerance": 3,
            "join_tolerance": 3,
            "edge_min_length": 3,
            "min_words_vertical": 3,
            "min_words_horizontal": 1
        }

    # =======================================================================
    # Main function for extracting text and tables in pdf
    # =======================================================================

    def process_file(self):
        """Process PDF and extract text and tables."""
        try:
            with pdfplumber.open(self.file_path) as pdf:
                # store the text from all tables in the pdf
                text_from_tables = []
                # store the pure text and table markers for each page
                pure_texts = []
                
                for pagenum, page in enumerate(pdf.pages):
                    try:
                        # get tables in the current page
                        tables = page.find_tables(table_settings=self._get_table_settings(page))
                        
                        # Extract and process tables first
                        for table_num, _ in enumerate(tables):
                            # Skip if this table has already been processed
                            if (pagenum, table_num) in self.processed_tables:
                                text_from_tables.append("")
                                continue
                            
                            curr_table = self._extract_table(pagenum, table_num)
                            
                            if curr_table:
                                table_string = self._table_converter(curr_table)
                                text_from_tables.append(table_string)
                            else:
                                text_from_tables.append("")
                        
                        # Get all table bounding boxes
                        bboxes = [table.bbox for table in tables]

                        # Sort tables by vertical position (top to bottom)
                        tables_with_pos = [(table.bbox[1], table) for table in tables]
                        tables_with_pos.sort(reverse=True)

                        # Get all text elements (words) with their positions
                        words = page.extract_words()
                        
                        # Add table positions to the sequence
                        elements = []
                        for word in words:
                            v_mid = (word["top"] + word["bottom"]) / 2
                            h_mid = (word["x0"] + word["x1"]) / 2
                            # Check if the word is within the table boundaries
                            in_any_table = False
                            for bbox in bboxes:
                                x0, top, x1, bottom = bbox
                                if (h_mid >= x0 and h_mid < x1 and v_mid >= top and v_mid < bottom):
                                    in_any_table = True
                                    break
                            # If the word is not within any table, add it to the elements
                            if not in_any_table:
                                elements.append({
                                    "top": word["top"],
                                    "content": word["text"] + " "
                                })
                        
                        # Add table markers
                        for _, table in tables_with_pos:
                            elements.append({
                                "top": table.bbox[1],
                                "content": "\n[[TABLE]]\n"
                            })
                        
                        # Sort all elements by vertical position (top to bottom)
                        elements.sort(key=lambda x: x["top"])
                        # Combine all content
                        pure_texts.append("".join(element["content"] for element in elements))
                    except Exception as e:
                        print(f"Error processing page {pagenum}: {str(e)}")
                        pure_texts.append("")
                        text_from_tables.append("")
                
                # Ensure we have matching lengths
                while len(pure_texts) > len(text_from_tables):
                    text_from_tables.append("")
                while len(text_from_tables) > len(pure_texts):
                    pure_texts.append("")
                
                table_iter = iter(text_from_tables)

                # Replace each [[TABLE]] in each string using regex and the next table name
                def replace_table(match):
                    try:
                        return next(table_iter)
                    except StopIteration:
                        return ""

                combined_result = [re.sub(r'\[\[TABLE\]\]', replace_table, s) for s in pure_texts]
                return " ".join(combined_result)
        except Exception as e:
            print(f"Error processing PDF file: {str(e)}")
            return ""
