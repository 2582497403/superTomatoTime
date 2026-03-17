# 从参数获取提醒信息
param(
    [string]$Title = "提醒",
    [string]$Message = "提醒时间到了！",
    [int]$Duration = 4
)

Add-Type -AssemblyName PresentationFramework

# ========== 智能主题检测 ==========
$lightMode = $true
try {
    $val = Get-ItemPropertyValue "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize" "AppsUseLightTheme" -EA 0
    $lightMode = ($null -eq $val -or $val -eq 1)
} catch {}

# ========== 颜色配置 ==========
$bg = if ($lightMode) { "#2A2A2A" } else { "#FFFFFF" }
$text = if ($lightMode) { "#E8E8E8" } else { "#1A1A1A" }
# ========== 精确位置计算：左右居中 + 顶部 1/6 处 ==========
$wa = [System.Windows.SystemParameters]::WorkArea
$w, $h = 350, 80  # 增加宽度以容纳标题和内容

# 左右居中（严格边界保护）
$left = [Math]::Max(
    $wa.Left + 20, 
    [Math]::Min(
        $wa.Left + ($wa.Width - $w) / 2, 
        $wa.Right - $w - 20
    )
)

# 顶部定位
$targetTop = $wa.Top
$top = [Math]::Max(
    $wa.Top + 200,  # 最小顶部边距
    [Math]::Min(
        $targetTop, 
        $wa.Bottom - $h # 最大顶部边距
    )
)

# ========== 精简 XAML（移除所有潜在问题点）==========
$xaml = @"
<Window xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation'
        WindowStyle='None'
        ResizeMode='NoResize'
        Topmost='True'
        Width='$w'
        Height='$h'
        Background='Transparent'
        AllowsTransparency='True'
        WindowStartupLocation='Manual'
        ShowInTaskbar='False'>

    <Border CornerRadius='12'
            Padding='20'
            Background='$bg'>

        <Border.Effect>
            <DropShadowEffect BlurRadius='18'
                              ShadowDepth='2'
                              Opacity='0.25'/>
        </Border.Effect>

        <StackPanel VerticalAlignment='Center'>
            <TextBlock x:Name='TitleText'
                       FontSize='18'
                       FontWeight='Bold'
                       Foreground='$text'
                       TextAlignment='Center'
                       Margin='0,0,0,4'/>
            
            <TextBlock x:Name='MessageText'
                       FontSize='14'
                       Foreground='$text'
                       TextAlignment='Center'
                       Opacity='0.8'/>
        </StackPanel>

    </Border>

</Window>
"@

# ========== 核心修复：使用Script作用域确保变量存活 ==========
$script:mainWindow = $null
$script:closeTimer = $null

try {
    $reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
    $script:mainWindow = [Windows.Markup.XamlReader]::Load($reader)
    $script:mainWindow.Left = $left
    $script:mainWindow.Top = $top
    $script:mainWindow.Opacity = 0  # 初始透明
    
    # ========== 关键修复：使用 Script 作用域绑定事件 ==========
    $script:mainWindow.Add_Loaded({
        # 设置文本内容
        $titleElement = $script:mainWindow.FindName('TitleText')
        $messageElement = $script:mainWindow.FindName('MessageText')
        if ($titleElement) {
            $titleElement.Text = "$using:Title"
        }
        if ($messageElement) {
            $messageElement.Text = "$using:Message"
        }
            
        # 淡入动画（300ms）
        $fadeIn = New-Object System.Windows.Media.Animation.DoubleAnimation @(0, 1, ([TimeSpan]::FromMilliseconds(300)))
        $script:mainWindow.BeginAnimation([System.Windows.Window]::OpacityProperty, $fadeIn)
            
        # 启动自动关闭定时器（Script 作用域确保可访问）
        $script:closeTimer = New-Object System.Windows.Threading.DispatcherTimer
        $script:closeTimer.Interval = [TimeSpan]::FromSeconds($using:Duration)
        $script:closeTimer.Add_Tick({
            $script:closeTimer.Stop()
            # 淡出动画（250ms）
            $fadeOut = New-Object System.Windows.Media.Animation.DoubleAnimation @(1, 0, ([TimeSpan]::FromMilliseconds(250)))
            $fadeOut.Add_Completed({ 
                if ($script:mainWindow -ne $null) { $script:mainWindow.Close() } 
            })
            $script:mainWindow.BeginAnimation([System.Windows.Window]::OpacityProperty, $fadeOut)
        })
        $script:closeTimer.Start()
    })
    
    # 保持置顶
    $script:mainWindow.Add_Activated({ $script:mainWindow.Topmost = $true })
    
    # 静默显示（无控制台输出）
    $null = $script:mainWindow.ShowDialog()
    
} catch {
    # 完全静默失败（绝不干扰用户）
    $null = $null
} finally {
    # 清理资源（防止内存泄漏）
    if ($script:closeTimer -ne $null) { $script:closeTimer.Stop(); $script:closeTimer = $null }
    if ($script:mainWindow -ne $null) { 
        try { $script:mainWindow.Close() } catch {}
        $script:mainWindow = $null 
    }
}