#!/bin/bash
echo "=== Iniciando despliegue ==="

echo ">>> Actualizando codigo..."
git pull origin main

echo ">>> Instalando dependencias..."
npm install --production

echo ">>> Reiniciando aplicacion..."
pm2 restart tienda

echo "=== Despliegue completado ==="
