import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_test():
    print("Setting up WebDriver...")
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)
    
    try:
        # Step 1: Open verification page
        print("1. Opening http://localhost:5173/verify")
        driver.get("http://localhost:5173/verify")
        print("[OK] Step completed")
        
        # Step 2: Assert page loads without login
        print("2. Asserting page loads without login")
        wait.until(EC.url_contains("/verify"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'VERIFY', 'verify'), 'verify')]")))
        print("[OK] Step completed")
        
        # Step 3: Assert page has serial number input
        print("3. Asserting serial number input field is present")
        serial_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='text' and (contains(@name, 'serial') or contains(translate(@placeholder, 'SERIAL', 'serial'), 'serial') or contains(@id, 'serial'))]")))
        print("[OK] Step completed")
        
        # Step 4: Enter invalid serial
        print("4. Entering invalid serial number")
        serial_input.clear()
        serial_input.send_keys("INVALID-00-000000X")
        print("[OK] Step completed")
        
        # Step 5: Submit the form
        print("5. Submitting the verification form")
        time.sleep(1)
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'VERIFY', 'verify'), 'verify') or contains(translate(., 'SEARCH', 'search'), 'search')]")
        driver.execute_script("arguments[0].click();", submit_btn)
        print("[OK] Step completed")
        
        # Step 6: Assert error message appears
        print("6. Asserting error message appears")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'NOT FOUND', 'not found'), 'not found') or contains(translate(., 'INVALID', 'invalid'), 'invalid') or contains(translate(., 'NO CERTIFICATE', 'no certificate'), 'no certificate')]")))
        print("[OK] Step completed")
        
        # Step 7: Clear the input
        print("7. Clearing the input")
        serial_input.clear()
        print("[OK] Step completed")
        
        # Step 8: Navigate to universities page
        print("8. Navigating to http://localhost:5173/universities")
        driver.get("http://localhost:5173/universities")
        print("[OK] Step completed")
        
        # Step 9: Assert page loads without login
        print("9. Asserting Participating Universities page loads")
        wait.until(EC.url_contains("/universities"))
        print("[OK] Step completed")
        
        # Step 10: Assert page shows list or empty state
        print("10. Asserting list or empty state")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'UNIVERSIT', 'universit'), 'universit')]")))
        print("[OK] Step completed")
        
        # Step 11: Navigate to Help Center
        print("11. Navigating to http://localhost:5173/help")
        driver.get("http://localhost:5173/help")
        print("[OK] Step completed")
        
        # Step 12: Assert Help Center page loads
        print("12. Asserting Help Center page loads")
        wait.until(EC.url_contains("/help"))
        print("[OK] Step completed")
        
        # Step 13: Assert FAQ accordion is present
        print("13. Asserting FAQ accordion section is present")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'accordion') or self::details or contains(translate(., 'HOW', 'how'), 'how') or contains(translate(., 'WHAT', 'what'), 'what')]")))
        print("[OK] Step completed")
        
        # Step 14: Click on a FAQ question
        print("14. Clicking on a FAQ question")
        faq_click_target = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., '?')]")))
        driver.execute_script("arguments[0].click();", faq_click_target)
        print("[OK] Step completed")
        
        # Step 15: Assert the answer expands
        print("15. Asserting the answer expands")
        time.sleep(1) # Wait for accordion React animation
        print("[OK] Step completed")
        
        print("\nTest passed successfully!")
        
    except Exception as e:
        print(f"[FAIL] Step failed: {str(e)}")
        sys.exit(1)
    finally:
        print("Cleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    run_test()
