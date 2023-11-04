from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import csv
import re

#Establecemos la página que queremos abrir
driver = webdriver.Chrome()
url = 'https://es.whoscored.com/Regions/206/Tournaments/4/Seasons/9682/Stages/22176/PlayerStatistics/España-LaLiga-2023-2024'

#Abrir adblock
options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument('load-extension=' + r"C:\Users\Raque\OneDrive\Documentos\Uni\3º\Proyecto I\pythonProject\DreamLeagueAssitant_PC1\adblocker")
driver = webdriver.Chrome(options=options)
driver.maximize_window()

time.sleep(4)


#Cerramos la página de adblocker
driver.switch_to.window(driver.window_handles[1])
driver.close()
driver.switch_to.window(driver.window_handles[0])
time.sleep(2)

#Abrimos la página
driver.get(url)
time.sleep(2)

#Aceptar cookies
wait = WebDriverWait(driver, 10)
boton = driver.find_element(By.CLASS_NAME, 'css-1wc0q5e')
boton.click()

#Cerrar pop-up inicial
try:
    boton2 = driver.find_element(By.CLASS_NAME, 'webpush-swal2-close')
    boton2.click()
except:
    pass

#Crear csv para escribir datos de partidos
with open('datospartidos.csv', mode='w', newline='', encoding='utf-8') as csv_file:
    csv_writer = csv.writer(csv_file)

#Ir a resumen de partidos
botonPartidos = driver.find_element_by_xpath('/html/body/div[5]/div[3]/div[2]/ul/li[1]')
botonPartidos.click()

#Ir a la última fecha disponible
while True:
    try:
        wait = WebDriverWait(driver, 4)
        botonAnterior = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/div[5]/div[3]/div[1]/div[4]/div/div/a[1]')))

        #Hacer click
        botonAnterior.click()
    except:
        pass

botonPartido = driver.find_element_by_class('result-1 rc')
botonPartido.click()

tablaPartido = driver.find_element_by_xpath('/html/body/div[5]/div[3]/div[1]/div[6]/div')
infoPartido = tablaPartido.text




time.sleep(1)

#Extraer el resumen de partidos
