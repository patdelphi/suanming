/**
 * ChineseButton 组件单元测试示例
 * 演示如何使用Vitest和Testing Library进行测试
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChineseButton } from '@/components/ui/ChineseButton'

describe('ChineseButton 组件', () => {
  it('应该正确渲染按钮文本', () => {
    render(<ChineseButton>测试按钮</ChineseButton>)
    expect(screen.getByText('测试按钮')).toBeInTheDocument()
  })

  it('应该应用variant样式', () => {
    render(<ChineseButton variant="primary">主按钮</ChineseButton>)
    const button = screen.getByText('主按钮')
    expect(button).toBeInTheDocument()
  })

  it('应该应用size样式', () => {
    render(<ChineseButton size="lg">大按钮</ChineseButton>)
    const button = screen.getByText('大按钮')
    expect(button).toBeInTheDocument()
  })

  it('应该禁用按钮当disabled=true', () => {
    render(<ChineseButton disabled>禁用按钮</ChineseButton>)
    const button = screen.getByText('禁用按钮') as HTMLButtonElement
    expect(button).toBeDisabled()
  })

  it('应该触发onClick事件', async () => {
    const handleClick = vi.fn()
    render(<ChineseButton onClick={handleClick}>点击我</ChineseButton>)
    const button = screen.getByText('点击我')
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
