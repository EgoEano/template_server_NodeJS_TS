import type { Express, Request, Response, NextFunction } from 'express';
import Logger from '../loggers/loggerService.js';
import { getEnv } from '../../services/utils/envWorker.js';

const { USER_AGENT_NAME, USER_AGENT_VERSION } = getEnv();
const allowedUserAgent: string = `X-${USER_AGENT_NAME}-Client/${USER_AGENT_VERSION}`;

const suspiciousUserAgents: string[] = [
    'curl', // Popular tool for working with URLs, used by bots
    'python', // Often used for writing bot scripts
    'Bingbot', // Bing search bot, sometimes spoofed by bots
    'Googlebot', // Google search bot, may be used in scanners
    'YandexBot', // Yandex search bot, but can be used maliciously
    'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)', // Old user agent, often used by scripts
    'Robot', // Bot for data collection
    'Scrapy', // Web scraper, Python library
    'Heritrix', // Web archiver, can also be used for crawling
];

const maliciousUserAgents: string[] = [
    'sqlmap', // Tool for automating SQL injection attacks
    'Nikto', // Script for web server vulnerability scanning
    'dirbuster', // Tool for directory brute-forcing on web servers
    'gobuster', // Tool for directory and virtual host brute-forcing
    'Wget', // CLI tool for downloading files, frequently used by bots
    'HTTrack', // Website cloning tool
    'libwww-perl', // Library for creating HTTP clients in Perl
    'WinHttp', // Windows component for HTTP communication
    'ZGrab', // Tool for web server scanning
    'masscan', // Very fast port scanner
    'Shodan', // Search engine for internet devices, can be used for scanning
    'Seeker', // Bot for crawling and vulnerability scanning
    'Sleuth', // Similar scanners for vulnerability discovery
    'Fuzzer', // Used for vulnerability testing
    'Burp Suite', // Popular security testing tool
    'nmap', // Tool for network and port scanning
    'Arachni', // Framework for vulnerability scanning
    'OWASP ZAP', // Open Web Application Security Project, tool for vulnerability scanning
    'Scanner', // Generic scanner request
    'W3af', // Web Application Attack and Audit Framework, security scanner
    'Bash Shell', // Used for scripting
];

export function userAgentBlackList(app: Express): void {
    app.use((req: Request, res: Response, next: NextFunction): void => {
        const ua: string = (req.headers['user-agent'] || '').toLowerCase().trim();
        if (
            !ua ||
            ua.length === 0 ||
            maliciousUserAgents.some((agent) => ua.includes(agent.toLowerCase())) ||
            suspiciousUserAgents.some((agent) => ua.includes(agent.toLowerCase()))
        ) {
            Logger.warn({
                message: `Blocked User-Agent. ip: ${req.ip}, Agent: ${ua}`,
                source: 'userAgentBlackList',
            });
            res.status(403).send('Forbidden');
            return;
        }
        next();
    });
}

export function userAgentWhiteList(app: Express): void {
    app.use((req: Request, res: Response, next: NextFunction): void => {
        const ua: string = (req.headers['user-agent'] || '').toLowerCase().trim();
        if (!ua || ua.length === 0 || ua !== allowedUserAgent) {
            Logger.warn({
                message: `Blocked User-Agent. ip: ${req.ip}, Agent: ${ua}`,
                source: 'userAgentWhiteList',
            });
            res.status(403).send('Forbidden');
            return;
        }
        next();
    });
}
