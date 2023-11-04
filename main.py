from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json

#Establecemos la página que queremos abrir
driver = webdriver.Chrome()
url = 'https://es.whoscored.com/Regions/206/Tournaments/4/Seasons/9682/Stages/22176/PlayerStatistics/España-LaLiga-2023-2024'

#Abrir adblock
options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument('load-extension=' + r"C:\Users\Raque\OneDrive\Documentos\Uni\3º\Proyecto I\webscrapping\adblocker")
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

time.sleep(2)

#Cerrar pop-up inicial
boton2 = driver.find_element(By.CLASS_NAME, 'webpush-swal2-close')
boton2.click()

#Seleccionar todos los jugadores
boton_jgdr = driver.find_element(By.XPATH, '/html/body/div[5]/div[5]/div[2]/div[1]/div[2]/dl[2]/dd[2]/a')
boton_jgdr.click()

print("Vamos a imprimir las estadísticas de los jugadores")

data = []  # Lista para almacenar la información en cada iteración
#for i in range(150):
# Extraer el resumen de partidos
texto = driver.find_element(By.ID, 'statistics-table-summary').text

# Dividir el texto en partes separadas por espacios
valores = texto.split()

# Crear un diccionario con las claves específicas y sus valores
summary_data = {
    'Jgdos': valores[0],
    'Mins': valores[1],
    'Goles': valores[2],
    'Asist': valores[3],
    'Amar': valores[4],
    'Roja': valores[5],
    'TpP': valores[6],
    'AP%': valores[7],
    'Aéreos': valores[8],
    'JdelP': valores[9],
    'Rating': valores[10]
}

# Agregar el diccionario a la lista de datos
data.append(summary_data)

#Escribir los datos recopilados en un archivo JSON
with open('datos_partidos.json', 'w') as file:
    json.dump(data, file, indent=4)

print('\n')
print("Vamos a imprimir las estadísticas de los equipos")

botonEquipos = driver.find_element_by_xpath('/html/body/div[5]/div[3]/div[2]/ul/li[3]/a')
botonEquipos.click()

#infoEquipos = driver.find_elements_by_xpath('/html/body/div[5]/div[6]/div[2]/div[3]/div')
#print(infoEquipos.text)