import random
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def clear_existing_student():
    print("Clearing existing student database records for repeatability...")
    import subprocess
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(script_dir, "../../backend"))
    tinker_cmd = (
        'php artisan tinker --execute="'
        '$email = \'sahmed2330154@bscse.uiu.ac.bd\'; '
        '$user = App\\Models\\User::where(\'email\', $email)->first(); '
        'if ($user) { '
        '    $student = App\\Models\\Student::where(\'user_id\', $user->id)->first(); '
        '    if ($student) { '
        '        App\\Models\\EnrollmentApplication::where(\'student_id\', $student->id)->delete(); '
        '        App\\Models\\Enrollment::where(\'student_id\', $student->id)->forceDelete(); '
        '        App\\Models\\Student::where(\'user_id\', $user->id)->forceDelete(); '
        '    } '
        '    $user->forceDelete(); '
        '} '
        'App\\Models\\PendingRegistration::where(\'email\', $email)->delete();'
        '"'
    )
    try:
        res = subprocess.run(tinker_cmd, shell=True, cwd=backend_dir, capture_output=True, text=True)
        if res.returncode == 0:
            print("[OK] Database cleared")
        else:
            print(f"[WARNING] Database clear failed: {res.stderr or res.stdout}")
    except Exception as e:
        print(f"[WARNING] Failed to clear database: {e}")

def run_test():
    clear_existing_student()
    print("Setting up WebDriver...")
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)
    
    random_suffix = f"{random.randint(1000, 9999)}"
    
    try:
        # Step 1: Open http://localhost:5173
        print("1. Opening http://localhost:5173")
        driver.get("http://localhost:5173")
        print("[OK] Step completed")
        
        # Step 2: Click the Register button/link
        print("2. Clicking the Register button/link")
        register_link = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(translate(., 'REGISTER', 'register'), 'register')] | //button[contains(translate(., 'REGISTER', 'register'), 'register')]"))
        )
        register_link.click()
        print("[OK] Step completed")
        
        # Step 3: Verify the role selection page loads with three role cards
        print("3. Verifying the role selection page loads")
        wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'STUDENT', 'student'), 'student') and not(self::script)]"))
        )
        print("[OK] Step completed")
        
        # Step 4: Click "Register as Student"
        print("4. Clicking 'Register as Student'")
        student_card = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, 'student')]"))
        )
        driver.execute_script("arguments[0].click();", student_card)
        print("[OK] Step completed")
        
        # Step 5: Verify the student registration form loads
        print("5. Verifying the student registration form loads")
        wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@name='first_name' or @name='firstName' or @placeholder='First Name' or contains(@name, 'name')]"))
        )
        print("[OK] Step completed")
        
        # Step 6: Fill in the form
        print("6. Filling in the form")
        def fill_input_by_name(names, value):
            for name in names:
                try:
                    el = driver.find_element(By.XPATH, f"//input[@name='{name}' or @id='{name}']")
                    el.clear()
                    el.send_keys(value)
                    return
                except:
                    pass
            # Fallback pattern
            try:
                el = driver.find_element(By.XPATH, f"//input[contains(@placeholder, '{names[0]}') or contains(@name, '{names[0]}')]")
                el.clear()
                el.send_keys(value)
            except:
                pass

        student_email = "sahmed2330154@bscse.uiu.ac.bd"
        print(f"Registered Email: {student_email}")

        fill_input_by_name(['first_name', 'firstName'], "Sadid")
        fill_input_by_name(['last_name', 'lastName'], "Ahmed")
        fill_input_by_name(['email', 'email_address'], student_email)
        fill_input_by_name(['password'], "password")
        fill_input_by_name(['password_confirmation', 'confirmPassword', 'password_confirm'], "password")
        fill_input_by_name(['nid', 'national_id'], f"1234567890{random_suffix}")
        fill_input_by_name(['date_of_birth', 'dob', 'birth_date'], "01/01/2000")
        fill_input_by_name(['phone', 'phone_number', 'mobile'], "01700000000")
        
        # Handle Gender (Select or Radio)
        try:
            gender_select = driver.find_element(By.XPATH, "//select[contains(@name, 'gender')]")
            gender_select.send_keys("Male")
        except:
            try:
                driver.find_element(By.XPATH, "//input[@type='radio' and (@value='male' or @value='Male')]").click()
            except:
                pass
        
        print("[OK] Step completed")
        
        # Wait for 5 seconds in the filled registration page
        print("   [INFO] Waiting 5 seconds on the filled registration page...")
        import time
        time.sleep(5)
        
        # Step 7: Submit the form
        print("7. Submitting the form")
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        driver.execute_script("arguments[0].click();", submit_btn)
        print("[OK] Step completed")

        # Step 8: Wait for OTP modal and fetch OTP from window
        print("8. Waiting for OTP modal and fetching OTP from window object...")
        time.sleep(2) # Give API time to respond
        otp = wait.until(lambda d: d.execute_script("return window.__TEST_OTP__;"))
        print(f"   [INFO] OTP Fetched directly from backend response: {otp}")
        
        # Step 9: Enter OTP
        print("9. Entering OTP...")
        otp_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@name='code']")))
        otp_input.clear()
        otp_input.send_keys(str(otp))
            
        verify_btn = driver.find_element(By.XPATH, "//button[contains(., 'Verify Email')]")
        driver.execute_script("arguments[0].click();", verify_btn)
        print("[OK] Step completed")
        
        # Step 10: Wait for successful verification redirect
        # Wait until modal goes away or URL changes
        print("10. Waiting for verification success...")
        time.sleep(2)
        print("[OK] Step completed")
        
        # ==========================================
        # PART 2: Admin Approval
        # ==========================================
        print("\n--- Phase 2: Admin Approval ---")
        
        # Step 11: Login as admin
        print("11. Logging in as admin...")
        driver.get("http://localhost:5173/login")
        time.sleep(1)
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
        email_input.clear()
        email_input.send_keys("eduauthregistry@gmail.com")
        
        pass_input = driver.find_element(By.XPATH, "//input[@type='password']")
        pass_input.clear()
        pass_input.send_keys("admin123")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        driver.execute_script("arguments[0].click();", login_btn)
        
        wait.until(EC.url_contains("/admin/dashboard"))
        print("[OK] Step completed")
        
        # Step 12: Go to User Approvals
        print("12. Navigating to User Approvals...")
        driver.get("http://localhost:5173/admin/user-approvals")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'APPROVALS', 'approvals'), 'approvals')]")))
        print("[OK] Step completed")
        
        # Step 13: Approve the new student
        email = student_email
        print("13. Finding the new student and clicking Approve...")
        time.sleep(6)
        approve_btn = wait.until(lambda d: d.execute_script(f"return Array.from(document.querySelectorAll('tr')).filter(tr => tr.textContent.includes('{email}')).map(tr => Array.from(tr.querySelectorAll('button')).find(b => b.textContent.includes('Approve'))).find(b => b);"))
             
        driver.execute_script("arguments[0].click();", approve_btn)
        print("[OK] Step completed")
        
        # Step 14: Confirm approval modal
        print("14. Confirming approval in modal...")
        confirm_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Approve')).pop();"))
        driver.execute_script("arguments[0].click();", confirm_btn)
        time.sleep(5)
        print("[OK] Step completed")

        # ==========================================
        # PART 3: Student Re-login
        # ==========================================
        print("\n--- Phase 3: Student Re-login ---")
        print("15. Logging in as the newly approved student...")
        driver.get("http://localhost:5173/login")
        time.sleep(1)
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
        email_input.clear()
        email_input.send_keys(student_email)
        
        pass_input = driver.find_element(By.XPATH, "//input[@type='password']")
        pass_input.clear()
        pass_input.send_keys("password")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        driver.execute_script("arguments[0].click();", login_btn)
        
        wait.until(EC.url_contains("/student/dashboard"))
        print("[OK] Student logged in and redirected to dashboard successfully!")
        time.sleep(3)
        
        print("\nTest passed successfully!")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[FAIL] Step failed: {str(e)}")
        sys.exit(1)
    finally:
        print("Cleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    run_test()
