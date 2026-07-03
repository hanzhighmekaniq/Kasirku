param($path)
$content = Get-Content $path -Raw
# Fix the literal \n characters - replace them with actual newlines
$content = $content -replace '\\n', "`r`n"
Set-Content $path -Value $content -NoNewline
Write-Host "Fixed $path"
