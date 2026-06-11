/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px',
			},
		},
		// 中式字体系统
		fontFamily: {
			'chinese': ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'STHeiti', 'WenQuanYi Micro Hei', 'sans-serif'],
			'serif-chinese': ['STSong', 'SimSun', '宋体', 'serif'],
		},
		// 统一字体规范系统
		fontSize: {
			// 保留原有尺寸以兼容现有代码
			'xs': ['0.75rem', { lineHeight: '1.5' }],
			'sm': ['0.875rem', { lineHeight: '1.6' }],
			'base': ['1rem', { lineHeight: '1.6' }],
			'lg': ['1.125rem', { lineHeight: '1.5' }],
			'xl': ['1.25rem', { lineHeight: '1.4' }],
			'2xl': ['1.5rem', { lineHeight: '1.3' }],
			'3xl': ['1.875rem', { lineHeight: '1.2' }],
			'4xl': ['2.25rem', { lineHeight: '1.2' }],
			'5xl': ['3rem', { lineHeight: '1.1' }],
			'6xl': ['3.5rem', { lineHeight: '1.1' }],
			
			// 新的语义化字体规范
			// 显示级标题
			'display-xl': ['3.5rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
			'display-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
			'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
			
			// 标题系列
			'heading-xl': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
			'heading-lg': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
			'heading-md': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
			'heading-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
			'heading-xs': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
			
			// 正文系列
			'body-xl': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
			'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
			'body-md': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
			'body-sm': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
			
			// 标签系列
			'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
			'label-md': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
			'label-sm': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
			
			// 按钮系列
			'button-lg': ['1rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.01em' }],
			'button-md': ['0.875rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.01em' }],
			'button-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.01em' }],
		},
		extend: {
			// 中式配色系统
			colors: {
				// 传统中式颜色
				'cinnabar': {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#DC143C', // 朱砂红主色
					600: '#c41e3a',
					700: '#a91b2e',
					800: '#8f1725',
					900: '#7c1420',
				},
				'gold': {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',
					500: '#FFD700', // 金黄色主色
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
				},
				'ink': {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#2C2C2C', // 墨黑色主色
				},
				'paper': {
					50: '#fefefe',
					100: '#fdfdfd',
					200: '#fafafa',
					300: '#f7f7f7',
					400: '#f3f3f3',
					500: '#F5F5DC', // 古纸色主色
					600: '#e8e8cd',
					700: '#d4d4b8',
					800: '#c0c0a3',
					900: '#a8a88a',
				},
				// 保留原有颜色以兼容现有组件
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#DC143C', // 更新为朱砂红
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: '#FFD700', // 更新为金黄色
					foreground: '#2C2C2C',
				},
				accent: {
					DEFAULT: '#708090', // 青灰色
					foreground: '#ffffff',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			// 中式间距系统 (基于4px)
			spacing: {
				'xs': '0.25rem', // 4px
				'sm': '0.5rem',  // 8px
				'md': '1rem',    // 16px
				'lg': '1.5rem',  // 24px
				'xl': '2rem',    // 32px
				'2xl': '3rem',   // 48px
				'3xl': '4rem',   // 64px
			},
			// 中式圆角系统
			borderRadius: {
				'none': '0',
				'sm': '0.25rem',   // 4px
				'DEFAULT': '0.375rem', // 6px
				'md': '0.5rem',    // 8px
				'lg': '0.75rem',   // 12px
				'xl': '1rem',      // 16px
				'2xl': '1.5rem',   // 24px
				'full': '9999px',
				// 保留原有变量以兼容
				'radius-lg': 'var(--radius)',
				'radius-md': 'calc(var(--radius) - 2px)',
				'radius-sm': 'calc(var(--radius) - 4px)',
			},
			// 中式阴影系统
			boxShadow: {
				'chinese-sm': '0 1px 3px rgba(220, 20, 60, 0.1)',
				'chinese': '0 4px 20px rgba(220, 20, 60, 0.15)',
				'chinese-md': '0 8px 25px rgba(220, 20, 60, 0.15)',
				'chinese-lg': '0 15px 35px rgba(220, 20, 60, 0.2)',
				'chinese-xl': '0 25px 50px rgba(220, 20, 60, 0.25)',
				'gold': '0 4px 20px rgba(255, 215, 0, 0.3)',
				'paper': '0 2px 10px rgba(245, 245, 220, 0.5)',
			},
			// 中式渐变背景
			backgroundImage: {
				'chinese-gradient': 'linear-gradient(135deg, #F5F5DC 0%, #FFD700 100%)',
				'cinnabar-gradient': 'linear-gradient(135deg, #DC143C 0%, #8f1725 100%)',
				'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #b45309 100%)',
				'paper-gradient': 'linear-gradient(135deg, #fefefe 0%, #F5F5DC 100%)',
			},
			// 中式动画
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'slide-in': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' },
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.5)' },
					'50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)' },
				},
				// 保留原有动画
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				// 保留原有动画
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}