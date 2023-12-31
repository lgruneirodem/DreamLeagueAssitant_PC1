from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

#Establecemos la página que queremos abrir
driver = webdriver.Chrome()
url = 'https://es.whoscored.com/Regions/206/Tournaments/4/Seasons/9682/Stages/22176/PlayerStatistics/España-LaLiga-2023-2024'

#Abrir adblock
options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument('load-extension=' + r"C:\Users\Raque\OneDrive\Documentos\Uni\3º\Proyecto I\pythonProject\DreamLeagueAssitant_PC1\adblocker"")
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
boton2 = driver.find_element(By.CLASS_NAME, 'webpush-swal2-close')
boton2.click()

#Seleccionar todos los jugadores
boton_jgdr = driver.find_element(By.XPATH, '/html/body/div[5]/div[5]/div[2]/div[1]/div[2]/dl[2]/dd[2]/a')
boton_jgdr.click()

for i in range(150):
    #Extrae el resumen de partidos
    texto = driver.find_element(By.ID, 'statistics-table-summary')
    print(texto.text)

    try:
        #Esperar hasta que el botón "Siguiente" sea interactuable
        wait = WebDriverWait(driver, 10)
        boton_siguiente = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/div[5]/div[5]/div[2]/div[4]/div/dl[2]/dd[3]/a')))

        #Hacer clic en el botón "Siguiente"
        boton_siguiente.click()
    except:
        pass  #Si el botón "Siguiente" no se encuentra o no es interactuable, pasa a la siguiente iteración

#Cierra el navegador al final del bucle
driver.quit()