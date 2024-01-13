from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
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

#Nos vamos a más
boton_mas = driver.find_element(By.XPATH, '//*[@id="content"]/header/div[2]/ul/li[5]/a')
boton_mas.click()
time.sleep(1)

#Nos vamos a jugadores
boton_jugadores = driver.find_element(By.XPATH, '//*[@id="content"]/div[2]/div[1]/button[2]')
boton_jugadores.click()
time.sleep(1)

#Le damos 10 veces al botón de cargar más
for i in range(10):
    # Esperar a que el botón sea clickable
    boton_cargar_mas = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, '/html/body/div[6]/div[3]/div[3]/div[1]/button'))
    )
    boton_cargar_mas.click()
    time.sleep(0.5)

#Contenedor de jugadores
contenedor_jugadores = driver.find_element(By.XPATH, '/html/body/div[6]/div[3]/div[3]/ul')
lista_jugadores = contenedor_jugadores.find_elements(By.CLASS_NAME, 'player-row')

links_jugadores = []

for jugador in lista_jugadores:
    link = jugador.find_element(By.CLASS_NAME, 'btn').get_attribute('href')
    links_jugadores.append(link)
