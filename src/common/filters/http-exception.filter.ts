import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Erreur interne du serveur';
    let error = 'Internal Server Error';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') { message = r; }
      else if (typeof r === 'object') { message = (r as any).message || message; error = (r as any).error || error; }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error('Unhandled: ' + exception.message, exception.stack);
    }
    response.status(status).json({ statusCode: status, error, message, timestamp: new Date().toISOString(), path: request.url });
  }
}
