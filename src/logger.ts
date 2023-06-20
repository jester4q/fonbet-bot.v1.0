import winston, { info } from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

export class Log {

    private static  instance: Log;

    private logger: winston.Logger;

    private constructor() {

        let date = new Date();


        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({format: "YYYY-MM-DD HH-mm:ss"}),
                winston.format.simple(),
                winston.format.printf(info => {
                    const {timestamp, level, message, ...args} = info;
                    return `[${timestamp}] [${level}]: ${message}`;
                  })
            ),
            defaultMeta: { service: 'user-service' },
            transports: [
                new DailyRotateFile({ 
                    filename: path.resolve('logs', '%DATE%.log'), 
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '100m',
                }),
              
            ],
          });

    }

    private static getInstance(): Log {
        if (!this.instance) {
            this.instance = new Log;
        }
        return this.instance;
    }

    public static out(log: string, ...params: any[]) {
        this.getInstance().logger.log('info', log, ...params);
    }

    public static err(log: string, ...params: any[]) {
        this.getInstance().logger.log('error', log, ...params);
    }
    

}