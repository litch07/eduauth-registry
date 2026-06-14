import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import os

def test_issue_certificate():
    print("Setting up WebDriver...")
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 15)
    action = ActionChains(driver)

    try:
        # ==========================================
        # PART 1: University Admin Issues Certificate
        # ==========================================
        print("\n--- Phase 1: University Admin Issues Certificate ---")
        
        # Step 1: Log in as University Admin
        print("1. Opening login page and logging in as Admin...")
        driver.get("http://localhost:5173/login")
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("admin@uiu.ac.bd")
        
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password123")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        driver.execute_script("arguments[0].click();", login_btn)
        
        wait.until(EC.url_contains("/university/dashboard") or EC.url_contains("/dashboard"))
        print("[OK] Logged in as Admin")
        
        # Step 2: Navigate to Issue Certificate page
        print("2. Navigating to Issue Certificate page...")
        driver.get("http://localhost:5173/university/issue-certificate")
        
        # Wait for the react-select container
        print("3. Searching for student...")
        search_input = wait.until(lambda d: d.execute_script("return document.querySelector('.react-select-container input');"))
        search_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        
        # User requested to wait 5-8 seconds because search takes time
        print("Waiting 8 seconds for student search results...")
        time.sleep(8)
        
        # Find the dropdown option and click it to select the student
        try:
            print("Locating react-select option...")
            option = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".react-select__option")))
            driver.execute_script("arguments[0].click();", option)
            print("Successfully clicked student option from dropdown")
        except Exception as e:
            print(f"Could not click react-select option: {e}. Trying Keys.ENTER...")
            search_input.send_keys(Keys.ENTER)
            
        time.sleep(5)  # Wait for prefill data to load
        print("[OK] Student selected")
        
        # Fill in CGPA and Degree Class
        print("4. Filling out certificate details...")
        cgpa_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='e.g. 3.75']")))
        cgpa_input.clear()
        cgpa_input.send_keys("3.95")
        driver.execute_script("""
            let input = arguments[0];
            let lastValue = input.value;
            input.value = '3.95';
            let event = new Event('input', { bubbles: true });
            let tracker = input._valueTracker;
            if (tracker) { tracker.setValue(lastValue); }
            input.dispatchEvent(event);
        """, cgpa_input)
        
        degree_class_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='e.g. First Class']")))
        degree_class_input.clear()
        degree_class_input.send_keys("First Class")
        driver.execute_script("""
            let input = arguments[0];
            let lastValue = input.value;
            input.value = 'First Class';
            let event = new Event('input', { bubbles: true });
            let tracker = input._valueTracker;
            if (tracker) { tracker.setValue(lastValue); }
            input.dispatchEvent(event);
        """, degree_class_input)
        
        print("[OK] Details filled")
        
        # Step 5: Issue Certificate
        print("5. Submitting certificate issue form...")
        issue_btn = wait.until(lambda d: d.execute_script(
            "return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Issue Certificate') && b.type === 'submit');"
        ))
        driver.execute_script("arguments[0].click();", issue_btn)
        
        # Wait for success toast or message
        time.sleep(3)
        print("[OK] Certificate issued")
        
        # ==========================================
        # PART 2: Student Views Certificate
        # ==========================================
        print("\n--- Phase 2: Student Views Certificate ---")
        
        # Step 6: Log out Admin
        print("6. Logging out Admin...")
        driver.get("http://localhost:5173/login")
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        print("[OK] Step completed")
        
        # Step 7: Log in as Student
        print("7. Logging in as Student...")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        driver.execute_script("arguments[0].click();", login_btn)
        
        wait.until(EC.url_contains("/student/dashboard") or EC.url_contains("/dashboard"))
        print("[OK] Logged in as Student")
        
        # Step 8: View My Certificates
        print("8. Navigating to My Certificates tab...")
        driver.get("http://localhost:5173/student/certificates")
        time.sleep(3)
        
        cert_found = wait.until(lambda d: d.execute_script("""
            let text = document.body.textContent;
            return text.includes('Bachelor of Science in Computer Science and Engineering') || text.includes('First Class') || text.includes('United International University');
        """))
        assert cert_found, "Certificate not found on Student dashboard!"
        print("[OK] Certificate visible on student dashboard!")
        
        print("9. Waiting for 10 seconds before closing browser...")
        time.sleep(10)
        print("[OK] Step completed")
        
        print("\nTest passed successfully!")

    except Exception as e:
        print(f"\n[FAIL] Step failed: {e}")
        driver.save_screenshot("error_screenshot_certificate.png")
        print("Screenshot saved to error_screenshot_certificate.png")
        raise
    finally:
        print("\nCleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    test_issue_certificate()
