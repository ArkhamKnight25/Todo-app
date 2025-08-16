# Fix verifyToken imports in API files
$files = @(
    "app\api\projects\[id]\route.ts",
    "app\api\projects\[id]\sections\route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'verifyToken', 'verifyAccessToken'
        Set-Content $file $content -NoNewline
        Write-Host "Fixed $file"
    }
}
