import pandas as pd
import numpy as np

class CSVProcessor:
    def __init__(self, file_path):
        self.file_path = file_path
        
    def _format_cell(self, value):
        """Format cell value to string, handling different data types."""
        if pd.isna(value):  # Handles None, NaN, NaT, etc.
            return 'None'
        elif isinstance(value, (int, float)):
            # Remove trailing zeros for floats
            return str(value).rstrip('0').rstrip('.') if '.' in str(value) else str(value)
        else:
            return str(value).strip()

    def _format_df_as_table(self, df):
        """Convert DataFrame into a formatted string representation."""
        content = []

        # Add headers first
        headers = [str(col).strip() for col in df.columns]
        content.append('|' + '|'.join(headers) + '|')

        # Process each row
        for _, row in df.iterrows():
            row_values = []
            is_empty_row = True
            
            for value in row:
                formatted_value = self._format_cell(value)
                if formatted_value != 'None':
                    is_empty_row = False
                row_values.append(formatted_value)
            
            # Only add non-empty rows
            if not is_empty_row:
                content.append('|' + '|'.join(row_values) + '|')

        return '\n'.join(content)

    def process_file(self):
        """Process CSV file and return formatted content."""
        try:
            # Read CSV file with pandas
            # - automatically detects encoding
            # - automatically infers data types
            # - handles missing values
            # - handles different delimiters
            df = pd.read_csv(self.file_path)
            # Replace numpy.nan with None for consistent handling
            df = df.replace({np.nan: None})
            return self._format_df_as_table(df)
                
        except Exception as e:
            print(f"Error processing CSV file: {str(e)}")
            return ""
