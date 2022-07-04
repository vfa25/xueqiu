const axios = require('axios');
const koa = require('koa');
const mount = require('koa-mount');
const dayjs = require('dayjs');
const fs = require('fs');

const HEADERS = {
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
  "cookie": fs.readFileSync(__dirname + '/cookie.txt', 'utf-8'),
  "Referer": "https://xueqiu.com/S/CSI931151",
};
const BEFORE_URL = 'https://stock.xueqiu.com/v5/stock/chart/kline.json';
const CURRENT_URL = 'https://stock.xueqiu.com/v5/stock/quote.json';
// const CURRENT_URL = 'https://stock.xueqiu.com/v5/stock/realtime/quotec.json';
const CONFIGS = [
  {
    name: 'CS新能车',
    code: 'SZ399976',
  },
  {
    name: '有色金属',
    code: 'SH000819',
  },
  {
    name: '中证农业',
    code: 'CSI000949',
  },
  {
    name: '光伏产业',
    code: 'CSI931151',
  },
  {
    name: '中证军工',
    code: 'SZ399967',
  },
  {
    name: '5G通信',
    code: 'CSI931079',
  },
  {
    name: '中证基建',
    code: 'CSI930608',
  },
  {
    name: '家用电器',
    code: 'CSI930697',
  },
  {
    name: '中证煤炭',
    code: 'SZ399998',
  },
  {
    name: '动漫游戏',
    code: 'CSI930901',
  },
  {
    name: '中证钢铁',
    code: 'CSI930606',
  },
  {
    name: '建筑材料',
    code: 'CSI931009',
  },
  {
    name: '证券公司',
    code: 'SZ399975',
  },
  {
    name: '国证芯片',
    code: 'SZ980017',
  },
  {
    name: '中证银行',
    code: 'SZ399986',
  },
  {
    name: '中证酒',
    code: 'SZ399987',
  },
  {
    name: '中证医疗',
    code: 'SZ399989',
  },
  {
    name: 'CS生医',
    code: 'CSI930726',
  },
  {
    name: '房地产',
    code: 'CSI931775',
  },
  {
    name: '恒生互联网ETF',
    code: 'SH513330',
  },
];

const app = new koa;

app.use(
  mount('/api', async (ctx) => {
      ctx.status = 200;
      console.log('访问 /api')
      const result = await Promise.all(CONFIGS.map(async (item) => {
        try {
          const response = await axios.get(BEFORE_URL, {
            "headers": HEADERS,
            params: {
              symbol: item.code,
              begin: Date.now(),
              period: 'day',
              type: 'before',
              count: -11,
              indicator: 'kline,pe,pb,ps,pcf,market_capital,agt,ggt,balance',
            }
          })
          const resData = response.data.data;
          const infoItems = resData.item.map((info) => {
            return info.reduce((total, val, index) => {
              const key = resData.column[index];
              if (key) {
                if (key === 'timestamp') {
                  total.originTimestamp = val;
                  total[key] = dayjs(val).format('YYYY/MM/DD')
                } else {
                  total[key] = val
                }
              }
              return total;
            }, {})
          })
          const curWeekStart = dayjs().startOf('week').toDate().getTime();
          let nearLessItem = null;
          const curWeekItems = infoItems.filter((item, index) => {
            const isCurWeek = item.originTimestamp >= curWeekStart;
            if (isCurWeek && nearLessItem === null && index > 0) {
              nearLessItem = infoItems[index - 1];
            }
            return isCurWeek;
          });

          const curNode = infoItems.splice(-1)[0];
          const beforeTimeSlot = `${infoItems[1].timestamp} - ${infoItems[infoItems.length - 1].timestamp}`;
          const beforeRate = getRate(infoItems[infoItems.length - 1].close, infoItems[0].close);
          const allRate = getRate(curNode.close, infoItems[0].close);
          const fiveRate = getRate(curNode.close, infoItems[5].close);
          const curWeekRate = nearLessItem && curWeekItems.length && getRate(curWeekItems[curWeekItems.length-1].close, nearLessItem.close);

          const result = {
            name: item.name,
            code: resData.symbol,
            beforeTimeSlot,
            beforeRate,
            allRate,
            fiveRate,
            curRate: curNode.percent,
            curWeekRate: curWeekRate || 0,
          };

          return result;
        } catch (e) {
          console.log('e', item.name, e)
        }
      }))
      result.sort((a, b) => b && a && (b.allRate - a.allRate));
      ctx.body = result.map((item) => {
        if (!item) {
          return item;
        }
        item.allRate = `${((item.allRate) * 100).toFixed(2)}%`;
        item.beforeRate = `${((item.beforeRate) * 100).toFixed(2)}%`;
        item.fiveRate = `${((item.fiveRate) * 100).toFixed(2)}%`;
        item.curRate = `${item.curRate}%`;
        item.curWeekRate = `${((item.curWeekRate) * 100).toFixed(2)}%`;
        return item;
      })
  })
)

app.use(
  mount('/', async (ctx) => {
    let originalUrl = ctx && ctx.originalUrl;
    if (!originalUrl || originalUrl === '/') {
      originalUrl = '/index.html'
    } else {
      ctx.set('cache-control', 'public, max-age=31536000');
    }
    ctx.status = 200;
    ctx.body = fs.readFileSync(__dirname + originalUrl, 'utf-8')
  })
)

module.exports = app;

function getRate(end, start) {
  return ((end - start) / start).toFixed(4);
}
