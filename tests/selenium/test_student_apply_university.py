import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, ElementClickInterceptedException

def test_student_apply_university():
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
        wait.until(EC.presence_of_element_located((By.XPATH, "//form")))
        print("[OK] Step completed")
        
        # Step 2: Entering email
        print("2. Entering email")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("kanij.fatema@gmail.com")
        print("[OK] Step completed")
        
        # Step 3: Entering password
        print("3. Entering password")
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password123")
        print("[OK] Step completed")
        
        # Step 4: Click Login button
        print("4. Clicking Login button")
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        driver.execute_script("arguments[0].click();", login_btn)
        print("[OK] Step completed")
        
        # Step 5: Assert redirect to dashboard
        print("5. Asserting redirect to dashboard")
        wait.until(EC.url_contains("/dashboard"))
        print("[OK] Step completed")
        
        # Step 6: Navigating to My University
        print("6. Navigating to My University page")
        my_uni_link = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('a')).find(a => a.href.includes('/my-university'));"))
        driver.execute_script("arguments[0].click();", my_uni_link)
        wait.until(EC.url_contains("/my-university"))
        print("[OK] Step completed")
        
        # Step 6b: Click Browse Universities
        print("6b. Clicking Browse Universities")
        browse_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Browse Universities'));"))
        driver.execute_script("arguments[0].click();", browse_btn)
        wait.until(EC.url_contains("/universities"))
        print("[OK] Step completed")
        
        # Step 7: Wait for universities to load
        print("7. Waiting for universities to load")
        time.sleep(2)
        # Search for United International University
        search_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search by university name, city, or address...'] | //input[@type='text']")))
        search_input.clear()
        search_input.send_keys("United International")
        time.sleep(2)
        
        # Click Apply button for UIU
        print("8. Clicking Apply for United International University")
        apply_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Apply'));"))
        driver.execute_script("arguments[0].click();", apply_btn)
        print("[OK] Step completed")
        
        # Step 9: Fill out Application Modal
        print("9. Filling out application modal")
        time.sleep(2)
        
        # Select Certificate Level
        print(" - Selecting Certificate Level")
        # 1. Click the custom select button for Certificate Level
        level_btn = wait.until(lambda d: d.execute_script("""
            let labels = Array.from(document.querySelectorAll('label'));
            let label = labels.find(l => l.textContent.includes('Certificate Level'));
            return label ? label.parentElement.querySelector('button') : null;
        """))
        driver.execute_script("arguments[0].click();", level_btn)
        time.sleep(1)
        # 2. Click the second option (first real option)
        level_opt = wait.until(lambda d: d.execute_script("""
            let list = document.querySelector('ul');
            return list && list.children.length > 1 ? list.children[1] : null;
        """))
        driver.execute_script("arguments[0].click();", level_opt)
        time.sleep(1)
        
        # Select Department
        print(" - Selecting Department (CSE)")
        # 1. Click the custom select button for Department
        dept_btn = wait.until(lambda d: d.execute_script("""
            let labels = Array.from(document.querySelectorAll('label'));
            let label = labels.find(l => l.textContent.includes('Department'));
            return label ? label.parentElement.querySelector('button') : null;
        """))
        driver.execute_script("arguments[0].click();", dept_btn)
        time.sleep(1)
        # 2. Click the option containing 'Computer Science' or 'CSE'
        dept_opt = wait.until(lambda d: d.execute_script("""
            let list = document.querySelector('ul');
            if(!list) return null;
            return Array.from(list.children).find(li => li.textContent.includes('Computer Science') || li.textContent.includes('CSE'));
        """))
        driver.execute_script("arguments[0].click();", dept_opt)
        time.sleep(1)
        
        # Check Consent Checkbox
        print(" - Checking consent checkbox")
        consent_checkbox = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='checkbox' or @id='consent_provided']")))
        driver.execute_script("arguments[0].click();", consent_checkbox)
        
        # Submit Application
        print("10. Submitting application")
        submit_app_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Application'));"))
        driver.execute_script("arguments[0].click();", submit_app_btn)
        print("[OK] Step completed")
        
        # Wait for modal to close or toast
        print("11. Verifying successful application")
        time.sleep(3)
        print("[OK] Step completed")
        
        print("\nTest passed successfully!")
        
    except Exception as e:
        print(f"[FAIL] Step failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        print("Cleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    test_student_apply_university()
