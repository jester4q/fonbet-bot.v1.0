import { Bot } from './bot';
import { Config } from './config';

const conf = new Config();
const bot = new Bot(conf);
bot.run();