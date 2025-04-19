from abc import ABC, abstractmethod

class Processor(ABC):
    def __init__(self, file_path: str):
        self.file_path = file_path

    @abstractmethod
    def process_file(self) -> str:
        pass
