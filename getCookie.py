from selenium import webdriver  # pip3 install selenium
from selenium.webdriver.chrome.options import Options
import time
from datetime import datetime

class GetCookie:
    def __init__(self):
        self.url = 'https://xueqiu.com/hq'
        self.headers = {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://xueqiu.com/S/CSI931151",
        }

    def generalDriver(self):
        options = Options()
        options.add_argument('--no-sandbox')
        options.add_argument('--headless')
        options.add_argument('--kiosk')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('disable-infobars')
        options.add_argument('window-size=1366x1800')
        options.add_argument('lang=zh_CN.UTF-8')
        user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36'
        options.add_argument('user-agent=%s'%user_agent)
        prefs = {
            'profile.default_content_setting_values': {
                'images': 2
            }
        }
        options.add_experimental_option('prefs', prefs)
        options.binary_location = "/usr/bin/google-chrome"
        chrome_driver_binary = '/www/chromedriver'
        self.driver = webdriver.Chrome(
            executable_path=chrome_driver_binary, chrome_options=options)

    def getCookie(self):
        self.driver.maximize_window()
        self.driver.get(self.url)
        time.sleep(5)
        cookie_test = self.driver.get_cookies()
        cookie = [item["name"] + "=" + item["value"] for item in cookie_test]
        cookiestr = '; '.join(item for item in cookie)
        print(cookiestr)
        with open('./cookie.txt','w') as file:
            file.write(cookiestr)
        self.driver.close()
        self.driver.quit()

    def updatePreWeekSelect(self):
        self.driver.get('http://10.vfa25.cn/')
        time.sleep(5)


if __name__ == '__main__':
    print()
    print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
    myCookie = GetCookie()
    print('初始化浏览器成功')
    myCookie.generalDriver()
    print('初始化Driver成功')
    if (datetime.now().weekday() == 0):
        myCookie.updatePreWeekSelect()
        print('更新上周选择成功')
    myCookie.getCookie()
    print('获取cookie成功')
    
