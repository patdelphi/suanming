// 时间转换工具模块
// 实现公历转干支、万年历算法等核心功能

class TimeConverter {
  constructor() {
    this.initializeData();
  }

  // 初始化基础数据
  initializeData() {
    // 天干
    this.TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    
    // 地支
    this.DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    // 地支对应时辰
    this.DIZHI_HOURS = {
      '子': [23, 1], '丑': [1, 3], '寅': [3, 5], '卯': [5, 7],
      '辰': [7, 9], '巳': [9, 11], '午': [11, 13], '未': [13, 15],
      '申': [15, 17], '酉': [17, 19], '戌': [19, 21], '亥': [21, 23]
    };
    
    // 月份地支对应
    this.MONTH_DIZHI = {
      1: '寅', 2: '卯', 3: '辰', 4: '巳', 5: '午', 6: '未',
      7: '申', 8: '酉', 9: '戌', 10: '亥', 11: '子', 12: '丑'
    };
    
    // 基准日期：2000年1月7日为甲子日（UTC）
    this.BASE_DATE = Date.UTC(2000, 0, 7);
    this.BASE_DAY_GANZHI_INDEX = 0; // 甲子在60甲子中的索引
  }

  /**
   * 获取年份干支
   * @param {number} year - 公历年份
   * @returns {Object} {gan: string, zhi: string}
   */
  getYearGanZhi(year) {
    // 以1984年甲子年为基准
    const baseYear = 1984;
    const offset = year - baseYear;
    
    const ganIndex = (offset % 10 + 10) % 10;
    const zhiIndex = (offset % 12 + 12) % 12;
    
    return {
      gan: this.TIANGAN[ganIndex],
      zhi: this.DIZHI[zhiIndex]
    };
  }

  /**
   * 获取月份干支（基于节气）
   * @param {Date} datetime - 日期时间对象
   * @returns {Object} {gan: string, zhi: string, lunarMonth: number}
   */
  getMonthGanZhiByDate(datetime) {
    // 节气对应的月支：立春=寅(2), 惊蛰=卯(3), 清明=辰(4), 立夏=巳(5), 
    // 芒种=午(6), 小暑=未(7), 立秋=申(8), 白露=酉(9), 寒露=戌(10), 
    // 立冬=亥(11), 大雪=子(0), 小寒=丑(1)
    const jieqiMonthMap = [
      { term: '立春', month: 1, zhi: '寅' },
      { term: '惊蛰', month: 2, zhi: '卯' },
      { term: '清明', month: 3, zhi: '辰' },
      { term: '立夏', month: 4, zhi: '巳' },
      { term: '芒种', month: 5, zhi: '午' },
      { term: '小暑', month: 6, zhi: '未' },
      { term: '立秋', month: 7, zhi: '申' },
      { term: '白露', month: 8, zhi: '酉' },
      { term: '寒露', month: 9, zhi: '戌' },
      { term: '立冬', month: 10, zhi: '亥' },
      { term: '大雪', month: 11, zhi: '子' },
      { term: '小寒', month: 12, zhi: '丑' }
    ];
    
    // 使用节气确定农历月
    // 简化处理：根据公历月份和日期估算
    const month = datetime.getMonth() + 1;
    const day = datetime.getDate();
    
    // 节气大约日期（每月4-7日左右）
    let lunarMonth, monthZhi;
    if (month === 1) {
      // 1月：小寒前=丑月，小寒后=丑月（实际是子月或丑月）
      lunarMonth = day < 6 ? 12 : 12; // 简化为丑月
      monthZhi = '丑';
    } else if (month === 2) {
      // 2月：立春前=丑月，立春后=寅月
      lunarMonth = day < 4 ? 12 : 1;
      monthZhi = day < 4 ? '丑' : '寅';
    } else if (month === 3) {
      // 3月：惊蛰前=寅月，惊蛰后=卯月
      lunarMonth = day < 6 ? 1 : 2;
      monthZhi = day < 6 ? '寅' : '卯';
    } else if (month === 4) {
      // 4月：清明前=卯月，清明后=辰月
      lunarMonth = day < 5 ? 2 : 3;
      monthZhi = day < 5 ? '卯' : '辰';
    } else if (month === 5) {
      // 5月：立夏前=辰月，立夏后=巳月
      lunarMonth = day < 6 ? 3 : 4;
      monthZhi = day < 6 ? '辰' : '巳';
    } else if (month === 6) {
      // 6月：芒种前=巳月，芒种后=午月
      lunarMonth = day < 6 ? 4 : 5;
      monthZhi = day < 6 ? '巳' : '午';
    } else if (month === 7) {
      // 7月：小暑前=午月，小暑后=未月
      lunarMonth = day < 7 ? 5 : 6;
      monthZhi = day < 7 ? '午' : '未';
    } else if (month === 8) {
      // 8月：立秋前=未月，立秋后=申月
      lunarMonth = day < 8 ? 6 : 7;
      monthZhi = day < 8 ? '未' : '申';
    } else if (month === 9) {
      // 9月：白露前=申月，白露后=酉月
      lunarMonth = day < 8 ? 7 : 8;
      monthZhi = day < 8 ? '申' : '酉';
    } else if (month === 10) {
      // 10月：寒露前=酉月，寒露后=戌月
      lunarMonth = day < 8 ? 8 : 9;
      monthZhi = day < 8 ? '酉' : '戌';
    } else if (month === 11) {
      // 11月：立冬前=戌月，立冬后=亥月
      lunarMonth = day < 7 ? 9 : 10;
      monthZhi = day < 7 ? '戌' : '亥';
    } else if (month === 12) {
      // 12月：大雪前=亥月，大雪后=子月
      lunarMonth = day < 7 ? 10 : 11;
      monthZhi = day < 7 ? '亥' : '子';
    }
    
    // 获取年干（考虑立春）
    let effectiveYear = datetime.getFullYear();
    if (month < 2 || (month === 2 && day < 4)) {
      effectiveYear--; // 立春前算上一年
    }
    const yearGan = this.getYearGanZhi(effectiveYear).gan;
    const yearGanIndex = this.TIANGAN.indexOf(yearGan);
    
    // 五虎遁月公式：年干索引*2 + 农历月 + 1
    const ganIndex = ((yearGanIndex * 2 + lunarMonth + 1) % 10 + 10) % 10;
    
    return {
      gan: this.TIANGAN[ganIndex],
      zhi: monthZhi,
      lunarMonth: lunarMonth
    };
  }

  /**
   * 获取月份干支（简化版，仅用于向后兼容）
   * @param {number} year - 公历年份
   * @param {number} month - 公历月份(1-12)
   * @returns {Object} {gan: string, zhi: string}
   * @deprecated 请使用 getMonthGanZhiByDate(datetime)
   */
  getMonthGanZhi(year, month) {
    const yearGan = this.getYearGanZhi(year).gan;
    const yearGanIndex = this.TIANGAN.indexOf(yearGan);
    
    // 月干计算公式：年干索引*2 + 月份 - 2
    const ganIndex = (yearGanIndex * 2 + month - 2) % 10;
    const zhi = this.MONTH_DIZHI[month];
    
    return {
      gan: this.TIANGAN[ganIndex],
      zhi: zhi
    };
  }

  /**
   * 获取日期干支
   * @param {Date} date - 日期对象
   * @returns {Object} {gan: string, zhi: string}
   */
  getDayGanZhi(date) {
    // 使用UTC日期计算天数差
    const targetDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const daysDiff = Math.floor((targetDate - this.BASE_DATE) / (1000 * 60 * 60 * 24));
    
    // 计算干支索引
    const ganzhiIndex = ((daysDiff % 60) + 60) % 60;
    
    const ganIndex = ganzhiIndex % 10;
    const zhiIndex = ganzhiIndex % 12;
    
    return {
      gan: this.TIANGAN[ganIndex],
      zhi: this.DIZHI[zhiIndex]
    };
  }

  /**
   * 获取时辰干支
   * @param {number} hour - 小时(0-23)
   * @param {string} dayGan - 日干
   * @returns {Object} {gan: string, zhi: string}
   */
  getHourGanZhi(hour, dayGan) {
    // 确定时支
    let zhi = '子';
    for (const [zhiName, [start, end]] of Object.entries(this.DIZHI_HOURS)) {
      if (start > end) { // 跨日情况（如子时23-1点）
        if (hour >= start || hour < end) {
          zhi = zhiName;
          break;
        }
      } else {
        if (hour >= start && hour < end) {
          zhi = zhiName;
          break;
        }
      }
    }
    
    // 计算时干
    const dayGanIndex = this.TIANGAN.indexOf(dayGan);
    const zhiIndex = this.DIZHI.indexOf(zhi);
    
    // 时干计算公式：日干索引*2 + 时支索引
    const ganIndex = (dayGanIndex * 2 + zhiIndex) % 10;
    
    return {
      gan: this.TIANGAN[ganIndex],
      zhi: zhi
    };
  }

  /**
   * 获取完整的四柱干支
   * @param {Date} datetime - 日期时间对象
   * @returns {Object} 四柱干支信息
   */
  getFourPillars(datetime) {
    const year = datetime.getFullYear();
    const month = datetime.getMonth() + 1;
    const day = datetime.getDate();
    const hour = datetime.getHours();
    
    const yearGZ = this.getYearGanZhi(year);
    const monthGZ = this.getMonthGanZhi(year, month);
    const dayGZ = this.getDayGanZhi(datetime);
    const hourGZ = this.getHourGanZhi(hour, dayGZ.gan);
    
    return {
      year: yearGZ,
      month: monthGZ,
      day: dayGZ,
      hour: hourGZ,
      yearString: `${yearGZ.gan}${yearGZ.zhi}`,
      monthString: `${monthGZ.gan}${monthGZ.zhi}`,
      dayString: `${dayGZ.gan}${dayGZ.zhi}`,
      hourString: `${hourGZ.gan}${hourGZ.zhi}`
    };
  }

  /**
   * 根据干支获取六十甲子索引
   * @param {string} gan - 天干
   * @param {string} zhi - 地支
   * @returns {number} 六十甲子索引(0-59)
   */
  getGanZhiIndex(gan, zhi) {
    const ganIndex = this.TIANGAN.indexOf(gan);
    const zhiIndex = this.DIZHI.indexOf(zhi);
    
    if (ganIndex === -1 || zhiIndex === -1) {
      throw new Error(`无效的干支: ${gan}${zhi}`);
    }
    
    // 六十甲子循环计算
    for (let i = 0; i < 60; i++) {
      if (i % 10 === ganIndex && i % 12 === zhiIndex) {
        return i;
      }
    }
    
    throw new Error(`无法计算干支索引: ${gan}${zhi}`);
  }

  /**
   * 根据索引获取干支
   * @param {number} index - 六十甲子索引(0-59)
   * @returns {Object} {gan: string, zhi: string}
   */
  getGanZhiByIndex(index) {
    if (index < 0 || index >= 60) {
      throw new Error(`索引超出范围: ${index}`);
    }
    
    return {
      gan: this.TIANGAN[index % 10],
      zhi: this.DIZHI[index % 12]
    };
  }

  /**
   * 计算两个日期之间的天数差
   * @param {Date} date1 - 起始日期
   * @param {Date} date2 - 结束日期
   * @returns {number} 天数差
   */
  getDaysDifference(date1, date2) {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * 判断是否为闰年
   * @param {number} year - 年份
   * @returns {boolean} 是否为闰年
   */
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * 获取月份天数
   * @param {number} year - 年份
   * @param {number} month - 月份(1-12)
   * @returns {number} 该月天数
   */
  getDaysInMonth(year, month) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    
    return daysInMonth[month - 1];
  }

  /**
   * 验证干支组合是否有效
   * @param {string} gan - 天干
   * @param {string} zhi - 地支
   * @returns {boolean} 是否有效
   */
  isValidGanZhi(gan, zhi) {
    try {
      this.getGanZhiIndex(gan, zhi);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取干支的阴阳属性
   * @param {string} ganZhi - 天干或地支
   * @returns {string} '阳' 或 '阴'
   */
  getYinYang(ganZhi) {
    const yangGan = ['甲', '丙', '戊', '庚', '壬'];
    const yangZhi = ['子', '寅', '辰', '午', '申', '戌'];
    
    if (yangGan.includes(ganZhi) || yangZhi.includes(ganZhi)) {
      return '阳';
    } else {
      return '阴';
    }
  }

  /**
   * 获取时辰名称
   * @param {number} hour - 小时(0-23)
   * @returns {string} 时辰名称
   */
  getShichenName(hour) {
    const shichen = {
      '子': '子时', '丑': '丑时', '寅': '寅时', '卯': '卯时',
      '辰': '辰时', '巳': '巳时', '午': '午时', '未': '未时',
      '申': '申时', '酉': '酉时', '戌': '戌时', '亥': '亥时'
    };
    
    for (const [zhi, [start, end]] of Object.entries(this.DIZHI_HOURS)) {
      if (start > end) { // 跨日情况
        if (hour >= start || hour < end) {
          return shichen[zhi];
        }
      } else {
        if (hour >= start && hour < end) {
          return shichen[zhi];
        }
      }
    }
    
    return '未知时辰';
  }
}

module.exports = TimeConverter;