from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

#Establecemos la página que queremos abrir
driver = webdriver.Chrome()
url = 'https://mister.mundodeportivo.com/'

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

time.sleep(200)

#Cierra el navegador al final del bucle
driver.quit()


