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
    driver.set_window_size(1920, 1080)
    wait = WebDriverWait(driver, 15)
    
    try:
        # Step 1: Open login page
        print("1. Opening http://localhost:5173/login")
        driver.get("http://localhost:5173/login")
        print("[OK] Step completed")
        
        # Step 2: Enter email
        print("2. Entering email")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        print("[OK] Step completed")
        
        # Step 3: Enter password
        print("3. Entering password")
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password")
        print("[OK] Step completed")
        
        # Step 4: Click Login button
        print("4. Clicking Login button")
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        login_btn.click()
        print("[OK] Step completed")
        
        # Step 5: Assert: redirected to student dashboard
        print("5. Asserting redirect to dashboard")
        wait.until(EC.url_contains("/student/dashboard"))
        print("[OK] Step completed")
        
        # Step 6: Assert: dashboard page title or heading contains "Dashboard"
        print("6. Asserting dashboard heading")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'DASHBOARD', 'dashboard'), 'dashboard') or contains(translate(., 'WELCOME', 'welcome'), 'welcome')]")))
        print("[OK] Step completed")
        
        # Step 7: Navigate to certificates page
        print("7. Navigating to certificates page")
        time.sleep(1)
        cert_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/certificates') or contains(translate(., 'CERTIFICATE', 'certificate'), 'certificate')]")))
        driver.execute_script("arguments[0].click();", cert_link)
        print("[OK] Step completed")
        
        # Step 8: Assert: certificates page loads
        print("8. Asserting certificates page loads")
        wait.until(EC.url_contains("/certificates"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'CERTIFICATE', 'certificate'), 'certificate')]")))
        print("[OK] Step completed")
        
        # Step 9: Navigate to My University page
        print("9. Navigating to My University page")
        time.sleep(1)
        uni_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/my-university') or contains(translate(., 'UNIVERSITY', 'university'), 'university')]")))
        driver.execute_script("arguments[0].click();", uni_link)
        print("[OK] Step completed")
        
        # Step 10: Assert: page loads
        print("10. Asserting My University page loads")
        wait.until(EC.url_contains("/my-university"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'UNIVERSITY', 'university'), 'university') or contains(translate(., 'ENROLL', 'enroll'), 'enroll')]")))
        print("[OK] Step completed")
        
        # Step 11: Click logout
        print("11. Clicking logout")
        time.sleep(3)
        logout_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout') || b.innerHTML.includes('log-out'));"))
        driver.execute_script("arguments[0].click();", logout_btn)
        print("[OK] Step completed")
        
        # Step 12: Assert: redirected to login or landing page
        print("12. Asserting redirect after logout")
        wait.until(lambda d: "/login" in d.current_url or d.current_url.strip("/") == "http://localhost:5173")
        print("[OK] Step completed")
        
        # Step 13: Assert: trying to access /student/dashboard now redirects back to login
        print("13. Asserting auth guard works")
        driver.get("http://localhost:5173/student/dashboard")
        wait.until(EC.url_contains("/login"))
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
