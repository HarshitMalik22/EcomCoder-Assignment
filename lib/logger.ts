
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: any;
    error?: any;
}

class Logger {
    private isDev = process.env.NODE_ENV !== 'production';

    private format(level: LogLevel, message: string, context?: any, error?: any): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        };
    }

    private output(entry: LogEntry) {
        if (this.isDev) {
            // Pretty print in dev
            const color = entry.level === 'error' ? '\x1b[31m' : entry.level === 'warn' ? '\x1b[33m' : '\x1b[36m';
            const reset = '\x1b[0m';
            console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`);
            if (entry.context) console.log(JSON.stringify(entry.context, null, 2));
            if (entry.error) console.error(entry.error);
        } else {
            // JSON logs for production (e.g. for aggregators)
            console.log(JSON.stringify(entry));
        }
    }

    info(message: string, context?: any) {
        this.output(this.format('info', message, context));
    }

    warn(message: string, context?: any) {
        this.output(this.format('warn', message, context));
    }

    error(message: string, error?: any, context?: any) {
        this.output(this.format('error', message, context, error));
    }

    debug(message: string, context?: any) {
        if (this.isDev || process.env.DEBUG) {
            this.output(this.format('debug', message, context));
        }
    }
}

export const logger = new Logger();
