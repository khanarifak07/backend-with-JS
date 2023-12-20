class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };

//100-199 (Informational Response)
//200-299 (successfull response)
//300-399 (Redirectional message response)
//400-499 (Client side error response)
//500-599 (Server side error response)
