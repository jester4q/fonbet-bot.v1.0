import puppeteer, { Browser, Page } from 'puppeteer';
import { Config } from "./config";
import { EvaluateFunc, PuppeteerLaunchOptions } from 'puppeteer';
import { ElementHandle } from 'puppeteer';
import { Log } from './logger';

export class BotBrowser {
    
    private browser: Browser;
    private page: Page;
    

    constructor(private config: Config) {
        this.config = config;
    }
    
    
    public async open (url: string, selector: string, width: number, height: number) {
        const options: PuppeteerLaunchOptions = {
            headless: false,
            //executablePath: this.config.pathToChrome(),
            args: [
                '--disable-gpu',
                '--no-sandbox',
                '--lang=en',
                '--disable-dev-shm-usage',
                '--disable-browser-side-navigation',
                '--mute-audio',
                `--window-size=${width},${height}`
            ],
        };
        this.browser = await puppeteer.launch(options);
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: width, height: height });
        await this.page.setRequestInterception(true);

        this.page.on('request', (req) => {
            if(req.resourceType() === 'image'){
                req.abort();
            }
            else {
                req.continue();
            }
        });
        //this.page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
        await this.page.goto(url);
        const loaded = await this.waitElement(selector);
        

        return loaded;

        /*
        ChromeOptions chromeOptions = new ChromeOptions();
        HashMap<String, Object> images = new HashMap<>();
        images.put("images", 2);
        HashMap<String, Object> prefs = new HashMap<>();
        prefs.put("profile.default_content_setting_values", images);
        chromeOptions.addArguments("--disable-extensions");
        chromeOptions.addArguments("window-size="+width+","+height+"");
        chromeOptions.setExperimentalOption("prefs", prefs);
        this.driver = new ChromeDriver(chromeOptions);
        Dimension dimension = new Dimension(width, height);
        driver.manage().window().setSize(dimension);
        this.driver.get(url);
        this.waitElement(selector);
        */
    }

    public async close() {
        await this.browser.close();
    }
    
    
    public async executeScript(js: EvaluateFunc<unknown[]>, ...args): Promise<any> {
        const bodyHandle = await this.page.$('body');
        const result = await this.page.evaluate(js, bodyHandle, ...args);
        await bodyHandle.dispose();
        return result;
    }
    
    /*
    public void waitUntil(int second, Function<WebDriver, Object> isTrue) {
        WebDriverWait waitDriver = new WebDriverWait(this.driver, Duration.ofSeconds(second));
        waitDriver.until(isTrue);
    }
    */
    /*
    public void waitElement(By selector) {
        WebDriverWait waitDriver = new WebDriverWait(this.driver, Duration.ofSeconds(this.config.pause()));
        waitDriver.until((WebDriver d) -> {
            WebElement el = d.findElement(selector);
            return el != null;
        });
    }
    */

    public waitElement(selector: string): Promise<boolean> {
        return this.page.waitForSelector(selector, {visible: true, timeout: this.config.pause()*1000 }).then(result => {
            return !!result;
        })
    }
    
    public async waitElementByClass(selector: string | string[]): Promise<boolean> {
        const find = Array.isArray(selector) && selector || [selector];


        const toClassSelector = find.map((c) => {
            return `[class^="${c}"]`;
        }).join(',');
        try {
            const visibleInput = await this.page.waitForSelector(toClassSelector, {visible: true, timeout: this.config.pause()*1000 })
            console.log('Found visible elements', toClassSelector);
            return true;
        } catch (e) {
            console.log('Could not find elements', toClassSelector, e.message);
        }

        return false;
   
    }
    /*
    
    public WebElement findElement(By selector) {
        return this.driver.findElement(selector);
    }
    */
    public navigate(url: string): Promise<void> {
        return this.page.goto(url).then((res) => {/*console.log(res)*/});
                
    }
    
    
    public reload(): Promise<any> {
        return this.page.reload();
    }
    
    /*
    public List<WebElement> findElement(classes) {
        return this.findElement(classes, null, this.driver);
    }
    
    public List<WebElement> findElement(String[] classes, WebElement root) {
        return this.findElement(classes, root, this.driver);
    }
    
    public List<WebElement> findElement(String[] classes, WebDriver driver) {
        return this.findElement(classes, null, driver);
    }
    */

    public findElement(selector: string, root: ElementHandle<Element> = null): Promise<ElementHandle<Element>> {
        if (root) {
            return root.waitForSelector(selector);
        }
        
        return this.page.waitForSelector(selector);
    }

    public async getChild(root: ElementHandle<Element>, no: number): Promise<ElementHandle<Element>> {
        const child = (await this.page.evaluateHandle((e, n) => e.children[n], root, no)).asElement();

        console.log(child.toString());

        return child || null;
    }

    public findElementByClass(selector: string[] | string, root: ElementHandle<Element> = null): Promise<ElementHandle<Element>[]> {
        const find = Array.isArray(selector) && selector || [selector];
        const toClassSelector = find.map((c) => {
            return `[class^="${c}"]`;
        }).join(',');
        if (root) {
            return root.$$(toClassSelector);
        }
        
        return this.page.$$(toClassSelector);
    }

    public getClassName(el: ElementHandle<Element>): Promise<string> {
        return this.page.evaluate(el => el.className, el);
    }

    public setTextToInput(el: ElementHandle<HTMLInputElement>, text: string): Promise<void> {
        return this.page.evaluate(input => {console.log(input, input.value); input.value = '';}, el).then(() => {
            Log.out('Input', text);
            return this.type(el, text);
        });

    }

    public async type(el: ElementHandle<Element>, text: string) {
        await el.focus();
        await el.type(text);
    }
    
    
    public stop(): Promise<void> {
        if (this.browser) {
            return this.browser.close();
        }
        this.browser = null;
        return Promise.resolve();
    }
    
}
