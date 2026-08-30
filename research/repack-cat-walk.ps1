param(
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination
)

Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Bitmap]::FromFile($Source)
$workingImage = New-Object System.Drawing.Bitmap $sourceImage.Width, $sourceImage.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Built-in image generation may return an opaque chroma-green source even when
# alpha was requested. Remove the green before measuring bounds so the sheet is
# packed around the cat rather than around the full source canvas.
for($y = 0; $y -lt $sourceImage.Height; $y++) {
  for($x = 0; $x -lt $sourceImage.Width; $x++) {
    $pixel = $sourceImage.GetPixel($x, $y)
    $greenKey = $pixel.G -gt 80 -and $pixel.G -gt ($pixel.R * 1.08) -and $pixel.G -gt ($pixel.B * 1.20)
    if($greenKey) {
      $workingImage.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
    } else {
      $workingImage.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, $pixel.R, $pixel.G, $pixel.B))
    }
  }
}
$frameCount = 4
$cellSize = 192
$clearance = 13
$baseline = 179
$bounds = @()

# Find each cat from the transparent columns between subjects. Generated sheets
# do not always center wide tails inside exact quarters, so quarter slicing can
# put one cat's head or paw into its neighbor's frame.
$runs = @()
$runStart = -1
for($x = 0; $x -lt $workingImage.Width; $x++) {
  $occupied = $false
  for($y = 0; $y -lt $workingImage.Height -and -not $occupied; $y++) {
    $occupied = $workingImage.GetPixel($x, $y).A -gt 16
  }
  if($occupied -and $runStart -lt 0) { $runStart = $x }
  if(-not $occupied -and $runStart -ge 0) {
    if(($x - $runStart) -gt 20) { $runs += [PSCustomObject]@{Start=$runStart; End=$x - 1} }
    $runStart = -1
  }
}
if($runStart -ge 0) { $runs += [PSCustomObject]@{Start=$runStart; End=$workingImage.Width - 1} }
if($runs.Count -ne $frameCount) { throw "Expected four separated subjects; found $($runs.Count)." }

for($frame = 0; $frame -lt $frameCount; $frame++) {
  $minX = $runs[$frame].Start
  $minY = $workingImage.Height
  $maxX = $runs[$frame].End
  $maxY = -1
  for($y = 0; $y -lt $workingImage.Height; $y++) {
    for($x = $minX; $x -le $maxX; $x++) {
      if($workingImage.GetPixel($x, $y).A -gt 16) {
        $minY = [math]::Min($minY, $y)
        $maxY = [math]::Max($maxY, $y)
      }
    }
  }
  if($maxX -lt 0) { throw "Frame $frame has no visible pixels." }
  $bounds += [PSCustomObject]@{
    X = $minX
    Y = $minY
    Width = $maxX - $minX + 1
    Height = $maxY - $minY + 1
    Bottom = $maxY
  }
}

$widest = ($bounds | Measure-Object Width -Maximum).Maximum
$tallest = ($bounds | Measure-Object Height -Maximum).Maximum
$scale = [math]::Min(($cellSize - 2 * $clearance) / $widest, ($baseline - $clearance) / $tallest)
$output = New-Object System.Drawing.Bitmap ($cellSize * $frameCount), $cellSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($output)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

for($frame = 0; $frame -lt $frameCount; $frame++) {
  $bound = $bounds[$frame]
  $drawWidth = [math]::Round($bound.Width * $scale)
  $drawHeight = [math]::Round($bound.Height * $scale)
  $drawX = $frame * $cellSize + [math]::Round(($cellSize - $drawWidth) / 2)
  $drawY = $baseline - $drawHeight
  $sourceRect = New-Object System.Drawing.Rectangle $bound.X, $bound.Y, $bound.Width, $bound.Height
  $destinationRect = New-Object System.Drawing.Rectangle $drawX, $drawY, $drawWidth, $drawHeight
  $graphics.DrawImage($workingImage, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
}

$graphics.Dispose()
$workingImage.Dispose()
$sourceImage.Dispose()

# Remove only saturated chroma-key spill introduced by background extraction.
# Natural orange fur is less saturated than these thresholds.
for($y = 0; $y -lt $output.Height; $y++) {
  for($x = 0; $x -lt $output.Width; $x++) {
    $pixel = $output.GetPixel($x, $y)
    if($pixel.A -eq 0) { continue }
    $redSpill = $pixel.R -gt 190 -and $pixel.G -lt 75 -and $pixel.B -lt 75
    $yellowSpill = $pixel.R -gt 190 -and $pixel.G -gt 145 -and $pixel.B -lt 70
    $magentaSpill = $pixel.R -gt 180 -and $pixel.B -gt 110 -and $pixel.G -lt 105
    if($redSpill -or $yellowSpill -or $magentaSpill) {
      $output.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
    }
  }
}

$output.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
$output.Dispose()
