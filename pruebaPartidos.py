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
options.add_argument('load-extension=' + r"C:\Users\pelay\Desktop\PC1\DreamLeagueAssitant_PC1\adblocker")
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

#Ir a resumen de encuentros
botonPartidos = driver.find_element(By.XPATH, '//*[@id="sub-navigation"]/ul/li[2]')
botonPartidos.click()

#Abrir desplegable
#botonMeses = driver.find_element_by_xpath('/html/body/div[5]/div[3]/div[1]/div[4]/div/div/a[2]')
#botonMeses.click()

#Ir a la última fecha disponible
for i in range(4):
    try:
        #Esperar hasta que el botón "Siguiente" sea interactuable
        wait = WebDriverWait(driver, 10)
        boton_siguiente = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/div[5]/div[3]/div[1]/div[4]/div/div/a[1]')))

        #Hacer clic en el botón "Siguiente"
        boton_siguiente.click()

    except:
        pass  #Si el botón "Siguiente" no se encuentra o no es interactuable, pasa a la siguiente iteración

time.sleep(2)
tabla = driver.find_element(By.XPATH, '//*[@id="tournament-fixture"]')
desplegables = tabla.find_elements(By.CLASS_NAME, 'show-incidents')
for desplegable in desplegables:
    try:
        desplegable.click()
        time.sleep(3)
        desplegable.click()
        driver.execute_script("window.scrollBy(0, 100);")
    except Exception as e:
        pass


# partidos = tabla.find_elements(By.CLASS_NAME, 'match-link')
# linkpartidos = []
# for link in partidos:
#     link = link.get_attribute('href')
#     linkpartidos.append(link)
# for partido in linkpartidos:
#     driver.get(partido)


botonPartido = driver.find_element(By.CLASS_NAME, 'result-1 rc')
botonPartido.click()

tablaPartido = driver.find_element(By.XPATH, '/html/body/div[5]/div[3]/div[1]/div[6]')
infoPartido = tablaPartido.text
print(tablaPartido.text)

#Extraer el resumen de partidos
