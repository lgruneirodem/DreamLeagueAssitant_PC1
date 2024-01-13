from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
import time
import sys
import csv
import re

sys.stdout.reconfigure(encoding='utf-8')

#Establecemos la página que queremos abrir
driver = webdriver.Chrome()
url = 'https://mister.mundodeportivo.com/'

#Abrir adblock
options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument('load-extension=' + r"C:\Users\pelay\Desktop\PC1\DreamLeagueAssitant_PC1\adblocker")
options.add_argument('--disable-notifications')
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
boton_cookies = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div/div/div/div[2]/button[2]')
boton_cookies.click()

time.sleep(0.2)

#Le damos a empezar 4 veces
for i in range(4):
    boton_empezar = driver.find_element(By.XPATH, '/html/body/div[2]/div/div[2]/div[2]/button')
    boton_empezar.click()
    time.sleep(0.2)

time.sleep(1)

#Darle al boton iniciar con google
boton_google = driver.find_element(By.XPATH, '/html/body/div[2]/div/div[2]/div/button[3]')
boton_google.click()
time.sleep(1)

#Metemos el email
email = driver.find_element(By.XPATH, '/html/body/div[2]/div/div[2]/div/form/div[1]/input')
email.send_keys('dreamleagueassistant@gmail.com')
time.sleep(0.2)

#Metemos contraseña
password = driver.find_element(By.XPATH, '/html/body/div[2]/div/div[2]/div/form/div[2]/input')
password.send_keys('PC1_GR_ 4')
time.sleep(0.2)

#Le damos a iniciar sesion
boton_iniciar = driver.find_element(By.XPATH, '/html/body/div[2]/div/div[2]/div/form/div[3]/button')
boton_iniciar.click()
time.sleep(1)


#Nos vamos al equipo
boton_mercado = driver.find_element(By.XPATH, '//*[@id="content"]/header/div[2]/ul/li[3]/a')
boton_mercado.click()
time.sleep(1)

#Encontramos media total
media_total = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[3]/div[1]/div[2]/div[1]').get_attribute('innerText')
media_total_numero = media_total.split()[2].replace(',', '.')
print(media_total_numero)

#Encontramos media portero
media_portero = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[3]/div[1]/div[2]/div[2]').get_attribute('innerText')
media_portero = media_portero.replace(',', '.')
print(media_portero)

#Encontramos media defensa
media_defensa = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[3]/div[1]/div[2]/div[3]').get_attribute('innerText')
media_defensa = media_defensa.replace(',', '.')
print(media_defensa)

#Encontramos media mediocentro
media_mediocentro = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[3]/div[1]/div[2]/div[4]').get_attribute('innerText')
media_mediocentro = media_mediocentro.replace(',', '.')
print(media_mediocentro)

#Encontramos media delantero
media_delantero = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[3]/div[1]/div[2]/div[5]').get_attribute('innerText')
media_delantero = media_delantero.replace(',', '.')
print(media_delantero)

# Econtramos el presupuesto del equipo
presupuesto = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[5]/div/div[1]/div[2]').get_attribute('innerText')

#Nos vamos a tabla de clasificación
boton_clasificacion = driver.find_element(By.XPATH, '//*[@id="content"]/header/div[2]/ul/li[4]/a')
boton_clasificacion.click()
time.sleep(1)

contenedor_equipos = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[2]/div[1]/ul')
equipos = contenedor_equipos.find_elements(By.CLASS_NAME, 'user-row')

estadisticas_equipo = []

for equipo in equipos:
    info = equipo.find_element(By.CLASS_NAME, 'info')
    nombre = info.find_element(By.CLASS_NAME, 'name').get_attribute('innerText')

    if nombre == 'M31-G4-DLA':
        jugadores_y_precio = info.find_element(By.CLASS_NAME, 'played').get_attribute('innerText')
        jugadores, precio = jugadores_y_precio.split(' · ')
        jugadores = jugadores.replace(' jugadores', '')
        points = equipo.find_element(By.CLASS_NAME, 'points').get_attribute('innerText')

        matches = re.findall(r'([+-]?\d+)', points)

        # El primer elemento en 'matches' es el número de puntos
        num_puntos = int(matches[0])
        try:
            # El segundo elemento en 'matches' es el diferencial de puntos con el signo
            dif_puntos = int(matches[1])
        except:
            dif_puntos = 0
        print(nombre, jugadores, precio, num_puntos, dif_puntos)

        equipo_stats = {
            'Nombre': nombre,
            'jugadores': jugadores,
            'Valor de plantilla': precio,
            'Puntos': num_puntos,
            'Diferencial de puntos': dif_puntos,
            'Media total': media_total_numero,
            'Media portero': media_portero,
            'Media defensa': media_defensa,
            'Media mediocentro': media_mediocentro,
            'Media delantero': media_delantero,
            'Presupuesto': presupuesto
        }
        estadisticas_equipo.append(equipo_stats)

with open('estadisticas_equipo.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['Nombre', 'jugadores', 'Valor de plantilla', 'Puntos', 'Diferencial de puntos', 'Media total', 'Media portero', 'Media defensa', 'Media mediocentro', 'Media delantero', 'Presupuesto']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for equipo in estadisticas_equipo:
        writer.writerow(equipo)



