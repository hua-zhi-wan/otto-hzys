from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
import os
import time


def get_files_in_directory(download_path):
	file_list = []
	for root, dirs, files in os.walk(download_path):
		for file in files:
			file_list.append(os.path.join(root, file))
	return file_list


def generate_otto(driver, text, original_disk_mode, download_path):
	textarea = driver.find_element(By.XPATH, '//textarea[@class="el-textarea__inner"]')
	textarea.clear()
	textarea.send_keys(text)

	if original_disk_mode:
		switch_button = driver.find_element(By.CLASS_NAME, "el-switch__input")
		driver.execute_script("arguments[0].click();", switch_button)

	button = driver.find_element(By.XPATH, '//button/span[text()="生成otto鬼叫"]')
	button.click()
	
	time.sleep(5)
	
	download_button = driver.find_element(By.XPATH, '//button[@class="el-button el-button--primary" and span[text()="下载原音频"]]')
	download_button.click()
	driver.quit()
	
	files = get_files_in_directory(download_path)
 
	return files[0]
	
	
def call_otto(text, download_path, ysdd):
	options = Options()
	options.add_argument("--headless")

	options.set_preference("browser.download.folderList", 2)
	options.set_preference("browser.download.manager.showWhenStarting", False)
	options.set_preference("browser.download.dir", download_path)
	options.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/octet-stream")

	driver = webdriver.Firefox(options=options)

	driver.get('https://otto-hzys.hanayabuki.cf/')
	
	file = generate_otto(driver, text, ysdd, download_path)
	
	return file
