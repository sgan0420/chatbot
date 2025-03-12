def success(data: dict, status: int = 200) -> tuple:
    return data, status


def error(message: str, status: int = 400) -> tuple:
    return {"error": message}, status
