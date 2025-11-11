# Ruta de tu proyecto local
$projectPath = "C:\PortalPasswordless"

# Crear carpetas necesarias para workflow
$workflowPath = Join-Path $projectPath ".github\workflows"
if (-not (Test-Path $workflowPath)) {
    New-Item -ItemType Directory -Path $workflowPath -Force
}

# Contenido del workflow usando comillas simples para no procesar $ o {}
$workflowContent = @'
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - name: Checkout GitHub repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Frontend Dependencies
        working-directory: frontend
        run: npm install

      - name: Build Frontend
        working-directory: frontend
        run: npm run build

      - name: Deploy to Azure Static Web App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_WITTY_SEA_04D5CEA03 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "frontend"
          api_location: "api"
          output_location: "frontend/dist"
'@

# Crear el archivo YAML del workflow
$workflowFile = Join-Path $workflowPath "azure-static-web-apps.yml"
Set-Content -Path $workflowFile -Value $workflowContent -Force
Write-Host "Workflow creado en $workflowFile"

# Inicializar git si no existe
Set-Location $projectPath
if (-not (Test-Path ".git")) {
    git init
    Write-Host "Git inicializado"
}

# Agregar archivos y hacer commit inicial
git add .
git commit -m "Agregar portal passwordless con workflow de Azure Static Web Apps"

Write-Host "¡Todo listo! Ahora puedes hacer push a tu repositorio de GitHub"
Write-Host "Ejemplo: git remote add origin https://github.com/TU_USUARIO/PortalPasswordless.git"
Write-Host "Luego: git branch -M main"
Write-Host "Finalmente: git push -u origin main"
