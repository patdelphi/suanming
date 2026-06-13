// 精确节气计算模块
// 基于天文算法和地理位置的高精度节气计算

class PreciseSolarTerms {
  constructor() {
    // 二十四节气名称
    this.solarTermNames = [
      '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
      '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
      '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ];
    
    // 节气对应的太阳黄经度数
    this.solarTermLongitudes = [
      315, 330, 345, 0, 15, 30,    // 立春到谷雨
      45, 60, 75, 90, 105, 120,    // 立夏到大暑
      135, 150, 165, 180, 195, 210, // 立秋到霜降
      225, 240, 255, 270, 285, 300  // 立冬到大寒
    ];
    
    // 地球轨道参数（简化）
    this.earthOrbitParams = {
      eccentricity: 0.0167,        // 轨道偏心率
      perihelionLongitude: 102.9,  // 近日点黄经
      obliquity: 23.44             // 黄赤交角
    };
    
    // 时区偏移缓存
    this.timezoneCache = new Map();
  }
  
  // 计算指定年份的所有节气时间
  calculateYearSolarTerms(year, longitude = 116.4, latitude = 39.9) {
    const solarTerms = [];
    
    for (let i = 0; i < 24; i++) {
      const termTime = this.calculateSolarTermTime(year, i, longitude, latitude);
      solarTerms.push({
        index: i,
        name: this.solarTermNames[i],
        longitude: this.solarTermLongitudes[i],
        time: termTime,
        localTime: this.convertToLocalTime(termTime, longitude),
        month: termTime.getMonth() + 1,
        day: termTime.getDate()
      });
    }
    
    return solarTerms;
  }
  
  // 计算特定节气的精确时间
  calculateSolarTermTime(year, termIndex, longitude = 116.4, latitude = 39.9) {
    const targetLongitude = this.solarTermLongitudes[termIndex];
    
    // 估算初始时间（基于平均值）
    let estimatedTime = this.getEstimatedTermTime(year, termIndex);
    
    // 使用牛顿迭代法精确计算
    for (let iteration = 0; iteration < 10; iteration++) {
      const currentLongitude = this.calculateSunLongitude(estimatedTime);
      // 计算最短角距离（-180, 180]，避免 normalizeLongitude 将微小负差变为近360°
      let longitudeDiff = targetLongitude - currentLongitude;
      while (longitudeDiff > 180) longitudeDiff -= 360;
      while (longitudeDiff <= -180) longitudeDiff += 360;
      
      if (Math.abs(longitudeDiff) < 0.0001) break; // 精度达到要求
      
      // 计算太阳运动速度（度/天）
      const sunSpeed = this.calculateSunSpeed(estimatedTime);
      const timeDiff = longitudeDiff / sunSpeed; // 天数
      
      estimatedTime = new Date(estimatedTime.getTime() + timeDiff * 24 * 60 * 60 * 1000);
    }
    
    return estimatedTime;
  }
  
  // 获取节气的估算时间
  getEstimatedTermTime(year, termIndex) {
    // 基于2000年的节气时间进行估算
    const baseYear = 2000;
    const yearDiff = year - baseYear;
    
    // 节气在一年中的大致时间（儒略日）
    const baseJulianDays = [
      // 立春到大寒的大致儒略日偏移
      34, 49, 64, 79, 94, 109, 124, 139, 154, 169, 184, 199,
      214, 229, 244, 259, 274, 289, 304, 319, 334, 349, 4, 19
    ];
    
    const baseJulianDay = this.getJulianDay(baseYear, 1, 1) + baseJulianDays[termIndex];
    const estimatedJulianDay = baseJulianDay + yearDiff * 365.25;
    
    return this.julianDayToDate(estimatedJulianDay);
  }
  
  // 计算太阳黄经
  calculateSunLongitude(date) {
    const julianDay = this.dateToJulianDay(date);
    const T = (julianDay - 2451545.0) / 36525.0; // 儒略世纪数
    
    // 太阳平黄经（度）
    let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    
    // 太阳平近点角（度）
    let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    
    // 地球轨道偏心率
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    
    // 太阳中心方程（度）
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(this.toRadians(M))
            + (0.019993 - 0.000101 * T) * Math.sin(this.toRadians(2 * M))
            + 0.000289 * Math.sin(this.toRadians(3 * M));
    
    // 太阳真黄经
    const sunLongitude = L0 + C;
    
    return this.normalizeLongitude(sunLongitude);
  }
  
  // 计算太阳运动速度
  calculateSunSpeed(date) {
    const julianDay = this.dateToJulianDay(date);
    const T = (julianDay - 2451545.0) / 36525.0;
    
    // 太阳平近点角
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    
    // 地球轨道偏心率
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    
    // 平均角速度（度/天）
    const meanSpeed = 0.9856474;
    
    // 考虑轨道偏心率的修正
    const speedCorrection = 2 * e * Math.sin(this.toRadians(M)) * meanSpeed;
    
    return meanSpeed + speedCorrection;
  }
  
  // 标准化黄经到0-360度范围
  normalizeLongitude(longitude) {
    while (longitude < 0) longitude += 360;
    while (longitude >= 360) longitude -= 360;
    return longitude;
  }
  
  // 转换为本地时间
  convertToLocalTime(utcTime, longitude) {
    // 根据经度计算时区偏移
    const timezoneOffset = Math.round(longitude / 15) * 60; // 分钟
    const localTime = new Date(utcTime.getTime() + timezoneOffset * 60 * 1000);
    return localTime;
  }
  
  // 获取指定日期所在的节气
  getSolarTermForDate(date, longitude = 116.4, latitude = 39.9) {
    const year = date.getFullYear();
    const yearTerms = this.calculateYearSolarTerms(year, longitude, latitude);
    
    // 将日期转换为经度对应的本地时间表示（与localTime保持一致）
    const timezoneOffsetMs = Math.round(longitude / 15) * 60 * 60 * 1000;
    const localDate = new Date(date.getTime() + timezoneOffsetMs);
    
    // 构建完整的节气列表：从上一年的大雪开始，按时间顺序到当年的冬至结束
    // 因为1月初的日期可能在上一年的大雪/冬至范围内
    const prevYearTerms = this.calculateYearSolarTerms(year - 1, longitude, latitude);
    const extendedTerms = [
      prevYearTerms[20], // 大雪 (上年12月)
      prevYearTerms[21], // 冬至 (上年12月)
      yearTerms[22],     // 小寒 (当年1月)
      yearTerms[23],     // 大寒 (当年1月)
      ...yearTerms.slice(0, 22) // 立春(0)到冬至(21)
    ];
    
    // 找到日期所在的节气区间（使用本地时间表示进行比较）
    for (let i = 0; i < extendedTerms.length; i++) {
      const currentTerm = extendedTerms[i];
      const nextTerm = extendedTerms[i + 1];
      if (!nextTerm) break;
      
      if (localDate >= currentTerm.localTime && localDate < nextTerm.localTime) {
        return {
          current: currentTerm,
          next: nextTerm,
          daysFromCurrent: Math.floor((localDate - currentTerm.localTime) / (24 * 60 * 60 * 1000)),
          daysToNext: Math.floor((nextTerm.localTime - localDate) / (24 * 60 * 60 * 1000))
        };
      }
    }
    
    // 检查是否在当年最后一个节气（冬至）之后
    const lastTerm = extendedTerms[extendedTerms.length - 1]; // 冬至 (Dec)
    if (localDate >= lastTerm.localTime) {
      const nextYearTerms = this.calculateYearSolarTerms(year + 1, longitude, latitude);
      return {
        current: lastTerm,
        next: nextYearTerms[22], // 下一年的小寒
        daysFromCurrent: Math.floor((localDate - lastTerm.localTime) / (24 * 60 * 60 * 1000)),
        daysToNext: Math.floor((nextYearTerms[22].localTime - localDate) / (24 * 60 * 60 * 1000))
      };
    }
    
    return null;
  }
  
  // 判断是否需要调整月柱（基于节气）
  shouldAdjustMonthPillar(birthDate, birthTime, longitude = 116.4, latitude = 39.9) {
    const fullDateTime = this.combineDateAndTime(birthDate, birthTime);
    const solarTermInfo = this.getSolarTermForDate(fullDateTime, longitude, latitude);
    
    if (!solarTermInfo) return { shouldAdjust: false };
    
    const currentTerm = solarTermInfo.current;
    const isAfterTerm = fullDateTime >= currentTerm.localTime;
    
    // 判断是否跨越了节气边界
    const month = fullDateTime.getMonth() + 1;
    const expectedTermMonth = this.getExpectedTermMonth(currentTerm.index);
    
    return {
      shouldAdjust: isAfterTerm && month !== expectedTermMonth,
      currentTerm: currentTerm,
      termTime: currentTerm.localTime,
      timeDifference: fullDateTime - currentTerm.localTime,
      recommendation: isAfterTerm ? '建议使用节气后的月柱' : '建议使用节气前的月柱'
    };
  }
  
  // 获取节气对应的预期月份
  getExpectedTermMonth(termIndex) {
    const termMonths = [
      2, 2, 3, 3, 4, 4,    // 立春到谷雨
      5, 5, 6, 6, 7, 7,    // 立夏到大暑
      8, 8, 9, 9, 10, 10,  // 立秋到霜降
      11, 11, 12, 12, 1, 1 // 立冬到大寒
    ];
    return termMonths[termIndex];
  }
  
  // 合并日期和时间
  combineDateAndTime(dateStr, timeStr) {
    const date = new Date(dateStr);
    if (!timeStr) return date;
    
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
    }
    
    return date;
  }
  
  // 获取儒略日
  getJulianDay(year, month, day) {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }
  
  // 日期转儒略日
  dateToJulianDay(date) {
    return this.getJulianDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) + 
           (date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600) / 24;
  }
  
  // 儒略日转日期
  julianDayToDate(julianDay) {
    const Z = Math.floor(julianDay + 0.5);
    const F = julianDay + 0.5 - Z;
    
    let A = Z;
    if (Z >= 2299161) {
      const alpha = Math.floor((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);
    
    const day = B - D - Math.floor(30.6001 * E) + F;
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    
    const date = new Date(year, month - 1, Math.floor(day));
    const hours = (day - Math.floor(day)) * 24;
    date.setHours(Math.floor(hours), Math.floor((hours - Math.floor(hours)) * 60));
    
    return date;
  }
  
  // 角度转弧度
  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }
  
  // 弧度转角度
  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }
  
  // 获取地理位置的时区信息
  getTimezoneInfo(longitude, latitude) {
    const cacheKey = `${longitude.toFixed(2)},${latitude.toFixed(2)}`;
    
    if (this.timezoneCache.has(cacheKey)) {
      return this.timezoneCache.get(cacheKey);
    }
    
    // 简化的时区计算（实际应该使用更精确的时区数据库）
    const timezoneOffset = Math.round(longitude / 15);
    const timezoneInfo = {
      offset: timezoneOffset,
      name: `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`,
      longitude: longitude,
      latitude: latitude
    };
    
    this.timezoneCache.set(cacheKey, timezoneInfo);
    return timezoneInfo;
  }
  
  // 计算两个节气之间的天数
  getDaysBetweenTerms(fromTermIndex, toTermIndex, year, longitude = 116.4, latitude = 39.9) {
    const yearTerms = this.calculateYearSolarTerms(year, longitude, latitude);
    const fromTerm = yearTerms[fromTermIndex];
    const toTerm = yearTerms[toTermIndex];
    
    let timeDiff = toTerm.localTime - fromTerm.localTime;
    if (timeDiff < 0) { // 跨年情况
      const nextYearTerms = this.calculateYearSolarTerms(year + 1, longitude, latitude);
      timeDiff = nextYearTerms[toTermIndex].localTime - fromTerm.localTime;
    }
    
    return Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  }
  
  // 获取节气统计信息
  getSolarTermStatistics(year, longitude = 116.4, latitude = 39.9) {
    const yearTerms = this.calculateYearSolarTerms(year, longitude, latitude);
    
    const statistics = {
      year: year,
      location: { longitude, latitude },
      totalTerms: yearTerms.length,
      seasonalTerms: {
        spring: yearTerms.slice(0, 6),
        summer: yearTerms.slice(6, 12),
        autumn: yearTerms.slice(12, 18),
        winter: yearTerms.slice(18, 24)
      },
      averageInterval: 0,
      maxInterval: 0,
      minInterval: Infinity
    };
    
    // 计算节气间隔统计
    for (let i = 0; i < yearTerms.length - 1; i++) {
      const interval = (yearTerms[i + 1].localTime - yearTerms[i].localTime) / (24 * 60 * 60 * 1000);
      statistics.averageInterval += interval;
      statistics.maxInterval = Math.max(statistics.maxInterval, interval);
      statistics.minInterval = Math.min(statistics.minInterval, interval);
    }
    
    statistics.averageInterval /= (yearTerms.length - 1);
    
    return statistics;
  }
}

module.exports = PreciseSolarTerms;