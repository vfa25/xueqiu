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
  "cookie": "device_id=44153862ec9ec6aeccc1ac95887d188a; xq_a_token=83886f7ef4add65155e8ef54dfc3e739afa7472a; xqat=83886f7ef4add65155e8ef54dfc3e739afa7472a; xq_r_token=3d8276bce14005098d67fa2215c6c4d3476900ab; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOi0xLCJpc3MiOiJ1YyIsImV4cCI6MTY1NjYzMTc0MywiY3RtIjoxNjU0OTIzMTYxNjExLCJjaWQiOiJkOWQwbjRBWnVwIn0.IdYw9zQDzXqH9RuBIv3q464UfzKn_39xma5Grltda-BW7pZxSv7bA3elp9pDO_rJK71mi2I6vyzblE5knkGtnaRo4LELKK7TpGzo62TQc_fI1fQrq-HYiODu9wblezD4d48nyxnqan5mRyZKyx8dcpEYYt3DuIyUyGYB2yl4JxOS4Tgp_oqu-o_DL4-t4h1V-6KuUl7JKBOH7QuAhiVmO-8rv4_4HTilzw7Ao_c0ZH5DXn5YyicSjj-1ERpxbcfiDiX_wwn5XulMGCX-smgd1rRUcyUPbqnQxA-_MT4TPA_PfjAiz0qtCOlRwp3Dz00REw13_VIqsF6VCsOysgZFJw; u=211654923189141; Hm_lvt_1db88642e346389874251b5a1eded6e3=1654923205; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1655136543",
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
                  total[key] = dayjs(val).format('YYYY/MM/DD')
                } else {
                  total[key] = val
                }
              }
              return total;
            }, {})
          })
          const curNode = infoItems.splice(-1)[0];
          const beforeTimeSlot = `${infoItems[1].timestamp} - ${infoItems[infoItems.length - 1].timestamp}`;
          const beforeRate = getRate(infoItems[infoItems.length - 1].close, infoItems[0].close);
          const allRate = getRate(curNode.close, infoItems[0].close);
          const result = {
            name: item.name,
            code: resData.symbol,
            beforeTimeSlot,
            beforeRate,
            allRate,
            curRate: curNode.percent,
            nineChange: `${infoItems[0].close}（${infoItems[0].timestamp && infoItems[0].timestamp.replace(/^\d+\//, '')}收）- ${infoItems[infoItems.length - 1].close}（${infoItems[infoItems.length - 1].timestamp && infoItems[infoItems.length - 1].timestamp.replace(/^\d+\//, '')}收）`
          };

          return result;
        } catch (e) {
          console.log('e', item.name)
        }
      }))
      result.sort((a, b) => b && a && (b.allRate - a.allRate));
      ctx.body = result.map((item) => {
        if (!item) {
          return item;
        }
        item.allRate = `${((item.allRate) * 100).toFixed(2)}%`;
        item.beforeRate = `${((item.beforeRate) * 100).toFixed(2)}%`;
        item.curRate = `${item.curRate}%`;
        return item;
      })
  })
)

app.use(
  mount('/', async (ctx) => {
    let originalUrl = ctx && ctx.originalUrl;
    if (!originalUrl || originalUrl === '/') {
      originalUrl = '/index.html'
    }
    ctx.status = 200;
    ctx.body = fs.readFileSync(__dirname + originalUrl, 'utf-8')
  })
)

module.exports = app;

function getRate(end, start) {
  return ((end - start) / start).toFixed(4);
}
