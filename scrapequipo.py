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

#Encontramos el contenedor del equipo y la lista de jugadores dentro de este
contenedor_equipo = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[4]/ul')
lista_jugadores = contenedor_equipo.find_elements(By.CLASS_NAME, 'player-row') 

sube_baja = {
    "↑": "Sube",
    "↓": "Baja",
    " ": "Mantiene"
}

posiciones = {
    "1": "Portero",
    "2": "Defensa",
    "3": "Mediocentro",
    "4": "Delantero"
}

equipos = {
    "1": "Atletic de Bilbao",
    "2": "Atletico de Madrid",
    "3": "Barça",
    "4": "Real Betis",
    "5": "Celta de Vigo",
    "9": "Getafe",
    "10": "Granada",
    "11": "UD Las Palmas",
    "14": "Rayo Vallecano",
    "15": "Real Madrid",
    "16": "Real Sociedad",
    "17": "Sevilla",
    "19": "Valencia",
    "20": "Villareal",
    "21": "UD Almería",
    "48": "Alavés",
    "50": "Osasuna",
    "222": "Girona",
    "408": "Mallorca",
    "499": "Cadiz",
}

estados = {
    "doubt": "Duda",
    "other": "Otro",
    "injury": "Lesionado",
    "five": "Acumulación de tarjetas",
    "red": "Roja directa",
}

#Creamos lista para almacenar los jugadores
jugadores_equipo_lista = []

#Jugadores en la la lista


#Buscamos todos los jugadores dentro del contenedor de jugadores
for jugador in lista_jugadores:
    info = jugador.find_element(By.CLASS_NAME, 'info')
    info_iconos = jugador.find_element(By.CLASS_NAME, 'icons')
    name_info = info.find_element(By.CLASS_NAME, 'name')
    precio_puja = jugador.find_element(By.CLASS_NAME, 'player-btns').get_attribute('innerText')
    nombre = name_info.get_attribute('innerText')
    texto_precio = info.find_element(By.CLASS_NAME, 'underName').get_attribute('innerText')
    precio = re.search(r'\d[\d,\.]+', texto_precio).group()
    try:
        sube_baja_de_precio = info.find_element(By.CLASS_NAME, 'value-arrow').get_attribute('innerText')
        cambio_precio = sube_baja[sube_baja_de_precio]
    except NoSuchElementException:
        # Manejar el caso en el que no se encuentra el elemento 'value-arrow'
        cambio_precio = "Mantiene"

    posicion_numero = info_iconos.find_element(By.XPATH, "../..//i").get_attribute('class')
    numero_posicion = posicion_numero.split('-')[1]
    posicion = posiciones.get(numero_posicion, "Desconocido")

    link_equipo = info_iconos.find_element(By.XPATH, "../..//img").get_attribute('src') 
    equipo_id = link_equipo.split('/')[-1].split('.')[0]
    nombre_equipo = equipos.get(equipo_id, "Desconocido")

    puntos_totales = info_iconos.find_element(By.CLASS_NAME, 'points').get_attribute('innerText')

    media_puntos = info.find_element(By.CLASS_NAME, 'avg').get_attribute('innerText')
    media_puntos = media_puntos.replace('"', '').replace(',', '.')

    try:
        status_class = name_info.find_element(By.CLASS_NAME, 'status')
        use_element = status_class.find_element(By.TAG_NAME, 'use')
        href_value = use_element.get_attribute('href')
        status_value = href_value.split('#')[-1]
    except NoSuchElementException:
        # Manejar el caso en el que no se encuentra el elemento 'status'
        status_value = None
    
    estado = estados.get(status_value, "Apto")

    info_mercado = {
        "Nombre": nombre,
        "Equipo": nombre_equipo,
        "Posicion": posicion,   
        "Precio Real": precio,
        "Sube/Baja": cambio_precio,
        "Precio Puja": precio_puja,
        "Media Puntos": media_puntos,
        "Puntos Totales": puntos_totales,
        "Estado": estado,
    }
    jugadores_equipo_lista.append(info_mercado)
    time.sleep(0.2)

with open('jugadores_equipo.csv', 'w', encoding='utf-8') as csvfile:
    fieldnames = ["Nombre", "Equipo", "Posicion", "Precio Real", "Sube/Baja", "Precio Puja", "Media Puntos", "Puntos Totales", "Estado"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for jugador in jugadores_equipo_lista:
        writer.writerow(jugador)



