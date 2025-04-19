from abc import ABC, abstractmethod

class Processor(ABC):
    @abstractmethod
    def process_file(self) -> str:
        pass
