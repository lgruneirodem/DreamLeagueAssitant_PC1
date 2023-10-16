import random
from time import sleep
from selenium import webdriver

driver = webdriver.Chrome()
url ='https://www.sofascore.com/tournament/football/spain/laliga/8#52376'
driver.get(url)