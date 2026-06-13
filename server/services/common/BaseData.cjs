// 共享基础数据类
// 统一天干地支、五行等基础数据结构，消除重复定义

class BaseData {
  constructor() {
    // 天干
    this.heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    
    // 地支
    this.earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    // 五行
    this.wuxing = ['木', '火', '土', '金', '水'];
    
    // 天干五行对应
    this.stemElements = {
      '甲': '木', '乙': '木',
      '丙': '火', '丁': '火', 
      '戊': '土', '己': '土',
      '庚': '金', '辛': '金',
      '壬': '水', '癸': '水'
    };
    
    // 地支五行对应
    this.branchElements = {
      '子': '水', '亥': '水',
      '寅': '木', '卯': '木',
      '巳': '火', '午': '火',
      '申': '金', '酉': '金',
      '辰': '土', '戌': '土', '丑': '土', '未': '土'
    };
    
    // 地支藏干表
    this.branchHiddenStems = {
      '子': ['癸'],
      '丑': ['己', '癸', '辛'],
      '寅': ['甲', '丙', '戊'],
      '卯': ['乙'],
      '辰': ['戊', '乙', '癸'],
      '巳': ['丙', '庚', '戊'],
      '午': ['丁', '己'],
      '未': ['己', '丁', '乙'],
      '申': ['庚', '壬', '戊'],
      '酉': ['辛'],
      '戌': ['戊', '辛', '丁'],
      '亥': ['壬', '甲']
    };
    
    // 五行相生关系
    this.wuxingGenerate = {
      '木': '火',
      '火': '土', 
      '土': '金',
      '金': '水',
      '水': '木'
    };
    
    // 五行相克关系
    this.wuxingOvercome = {
      '木': '土',
      '火': '金',
      '土': '水', 
      '金': '木',
      '水': '火'
    };
    
    // 天干阴阳属性
    this.stemYinYang = {
      '甲': '阳', '乙': '阴',
      '丙': '阳', '丁': '阴',
      '戊': '阳', '己': '阴', 
      '庚': '阳', '辛': '阴',
      '壬': '阳', '癸': '阴'
    };
    
    // 地支阴阳属性
    this.branchYinYang = {
      '子': '阳', '丑': '阴', '寅': '阳', '卯': '阴',
      '辰': '阳', '巳': '阴', '午': '阳', '未': '阴',
      '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴'
    };
    
    // 十二生肖
    this.zodiacAnimals = {
      '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
      '辰': '龙', '巳': '蛇', '午': '马', '未': '羊', 
      '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };
    
    // 时辰对应表
    this.hourBranches = {
      23: '子', 1: '丑', 3: '寅', 5: '卯',
      7: '辰', 9: '巳', 11: '午', 13: '未',
      15: '申', 17: '酉', 19: '戌', 21: '亥'
    };
  }
  
  // 获取天干五行
  getStemElement(stem) {
    return this.stemElements[stem] || null;
  }
  
  // 获取地支五行
  getBranchElement(branch) {
    return this.branchElements[branch] || null;
  }
  
  // 获取地支藏干
  getBranchHiddenStems(branch) {
    return this.branchHiddenStems[branch] || [];
  }
  
  // 获取天干阴阳
  getStemYinYang(stem) {
    return this.stemYinYang[stem] || null;
  }
  
  // 获取地支阴阳
  getBranchYinYang(branch) {
    return this.branchYinYang[branch] || null;
  }
  
  // 获取生肖
  getZodiacAnimal(branch) {
    return this.zodiacAnimals[branch] || null;
  }
  
  // 根据时辰获取地支
  getHourBranch(hour) {
    // 处理时辰范围
    if (hour >= 23 || hour < 1) return '子';
    if (hour >= 1 && hour < 3) return '丑';
    if (hour >= 3 && hour < 5) return '寅';
    if (hour >= 5 && hour < 7) return '卯';
    if (hour >= 7 && hour < 9) return '辰';
    if (hour >= 9 && hour < 11) return '巳';
    if (hour >= 11 && hour < 13) return '午';
    if (hour >= 13 && hour < 15) return '未';
    if (hour >= 15 && hour < 17) return '申';
    if (hour >= 17 && hour < 19) return '酉';
    if (hour >= 19 && hour < 21) return '戌';
    if (hour >= 21 && hour < 23) return '亥';
    return '子';
  }
  
  // 判断五行相生关系
  isWuxingGenerate(element1, element2) {
    return this.wuxingGenerate[element1] === element2;
  }
  
  // 判断五行相克关系
  isWuxingOvercome(element1, element2) {
    return this.wuxingOvercome[element1] === element2;
  }
  
  // 获取天干索引
  getStemIndex(stem) {
    return this.heavenlyStems.indexOf(stem);
  }
  
  // 获取地支索引
  getBranchIndex(branch) {
    return this.earthlyBranches.indexOf(branch);
  }
  
  // 根据索引获取天干
  getStemByIndex(index) {
    return this.heavenlyStems[index % 10];
  }
  
  // 根据索引获取地支
  getBranchByIndex(index) {
    return this.earthlyBranches[index % 12];
  }

  // ===== 纳音五行表 =====
  getNayinWuxing(stemIndex, branchIndex) {
    // 六十甲子纳音表
    const nayinTable = [
      '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木',
      '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火',
      '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金',
      '杨柳木', '杨柳木', '泉中水', '泉中水', '屋上土', '屋上土',
      '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
      '砂石金', '砂石金', '山下火', '山下火', '平地木', '平地木',
      '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火',
      '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金',
      '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土',
      '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
    ];
    const sexagenary = this.getSexagenaryIndex(stemIndex, branchIndex);
    const nayinName = nayinTable[sexagenary] || '海中金';
    // 纳音五行：每两组相同纳音
    const nayinElements = ['金', '火', '木', '土', '金', '火', '土', '金', '水', '木',
      '土', '火', '木', '水', '土', '火', '木', '水', '土', '火',
      '木', '水', '土', '火', '木', '水', '火', '木', '水', '水'];
    return {
      name: nayinName,
      element: nayinElements[Math.floor(sexagenary / 2)] || '金'
    };
  }

  // 获取六十甲子序号 (0-59)
  getSexagenaryIndex(stemIndex, branchIndex) {
    const s = ((stemIndex % 10) + 10) % 10;
    const b = ((branchIndex % 12) + 12) % 12;
    // 解中国剩余定理: n ≡ s (mod 10), n ≡ b (mod 12)
    for (let i = 0; i < 60; i++) {
      if (i % 10 === s && i % 12 === b) return i;
    }
    return 0;
  }

  // ===== 农历转换 =====
  // 农历数据表 (1900-2100)，每年用一个十六进制数表示
  // 高4位: 闰月天数(0=29天,1=30天); 中间12位: 1-12月大小(1=30天,0=29天); 低4位: 闰月月份(0=无闰月)
  lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  // 公历转农历
  solarToLunar(year, month, day) {
    if (year < 1900 || year > 2100) return { year, month, day, isLeap: false };

    let offset = 0;
    const baseDate = new Date(1900, 0, 31); // 1900年正月初一
    const targetDate = new Date(year, month - 1, day);
    offset = Math.floor((targetDate - baseDate) / 86400000);

    let lunarYear = 1900;
    let daysInYear;
    for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
      daysInYear = this.lunarYearDays(lunarYear);
      if (offset < daysInYear) break;
      offset -= daysInYear;
    }
    if (offset < 0) {
      lunarYear--;
      offset += this.lunarYearDays(lunarYear);
    }

    const leap = this.leapMonth(lunarYear);
    let lunarMonth = 0;
    let isLeap = false;
    let daysInMonth;
    let leapProcessed = false;

    for (let i = 1; i <= 12; i++) {
      // 闰月
      if (leap > 0 && i === (leap + 1) && !leapProcessed) {
        --i;
        leapProcessed = true;
        daysInMonth = this.leapDays(lunarYear);
        isLeap = true;
        if (offset < daysInMonth) {
          lunarMonth = i;
          break;
        }
        offset -= daysInMonth;
        isLeap = false;
        continue;
      }

      daysInMonth = this.monthDays(lunarYear, i);
      if (offset < daysInMonth) {
        lunarMonth = i;
        break;
      }
      offset -= daysInMonth;
    }

    if (offset === 0 && isLeap && leap > 0 && lunarMonth === leap + 1) {
      // 正好是闰月第一天
    } else if (offset === 0 && lunarMonth === 0) {
      lunarMonth = 12;
    }

    const lunarDay = offset + 1;

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeap
    };
  }

  // 农历某年的总天数
  lunarYearDays(year) {
    let sum = 348; // 12个月 * 29天 = 348
    const info = this.lunarInfo[year - 1900];
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (info & i) ? 1 : 0;
    }
    return sum + this.leapDays(year);
  }

  // 农历某年闰月天数
  leapDays(year) {
    if (this.leapMonth(year)) {
      return (this.lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  // 农历某年闰月月份
  leapMonth(year) {
    return this.lunarInfo[year - 1900] & 0xf;
  }

  // 农历某年某月天数
  monthDays(year, month) {
    return (this.lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
  }

  // ===== 统一四化表 =====
  getSiHuaTable() {
    return {
      '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
      '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
      '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
      '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
      '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
      '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
      '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
      '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
      '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
      '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' }
    };
  }

  // ===== 五行生克关系 =====
  getWuxingRelations() {
    return {
      '木': { generates: '火', controls: '土', generatedBy: '水', controlledBy: '金' },
      '火': { generates: '土', controls: '金', generatedBy: '木', controlledBy: '水' },
      '土': { generates: '金', controls: '水', generatedBy: '火', controlledBy: '木' },
      '金': { generates: '水', controls: '木', generatedBy: '土', controlledBy: '火' },
      '水': { generates: '木', controls: '火', generatedBy: '金', controlledBy: '土' }
    };
  }
}

module.exports = BaseData;