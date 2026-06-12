# Script PowerShell per creare icone base per The Final Radar
# Questo script crea icone PNG semplici usando .NET

Add-Type -AssemblyName System.Drawing

function Create-Icon([int]$size, [bool]$maskable = $false) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, 
        [System.Drawing.Color]::FromArgb(59, 130, 246),
        [System.Drawing.Color]::FromArgb(15, 23, 42),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    
    if ($maskable) {
        $graphics.FillRectangle($gradient, $rect)
    } else {
        $graphics.FillRectangle($gradient, $rect)
    }
    
    # Radar circles
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 77), $size * 0.008)
    for ($r = 0.4; $r -le 0.8; $r += 0.1) {
        $radius = $size * $r
        $graphics.DrawEllipse($pen, $size/2 - $radius, $size/2 - $radius, $radius * 2, $radius * 2)
    }
    
    # Center point
    $centerRadius = $size * 0.04
    $centerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(229, 57, 53))
    $graphics.FillEllipse($centerBrush, $size/2 - $centerRadius, $size/2 - $centerRadius, $centerRadius * 2, $centerRadius * 2)
    
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $size * 0.008)
    $graphics.DrawEllipse($whitePen, $size/2 - $centerRadius, $size/2 - $centerRadius, $centerRadius * 2, $centerRadius * 2)
    
    # T.F.R text
    if ($size -ge 128) {
        $font = New-Object System.Drawing.Font("Arial", $size * 0.07, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $textSize = $graphics.MeasureString("T.F.R", $font)
        $textX = ($size - $textSize.Width) / 2
        $textY = $size * 0.93
        $graphics.DrawString("T.F.R", $font, $textBrush, $textX, $textY)
    }
    
    $graphics.Dispose()
    return $bitmap
}

# Genera icone standard
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($size in $sizes) {
    $icon = Create-Icon $size $false
    $filename = "icon-$size.png"
    $icon.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()
    Write-Host "Created $filename"
}

# Genera icone maskable
$maskableSizes = @(192, 512)
foreach ($size in $maskableSizes) {
    $icon = Create-Icon $size $true
    $filename = "icon-maskable-$size.png"
    $icon.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()
    Write-Host "Created $filename"
}

Write-Host "All icons created successfully!"