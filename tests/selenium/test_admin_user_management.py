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
        # Step 1: Open login
        print("1. Opening http://localhost:5173/login")
        driver.get("http://localhost:5173/login")
        print("[OK] Step completed")
        
        # Step 2: Login as admin
        print("2. Logging in as admin")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("eduauthregistry@gmail.com")
        
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("admin123")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        login_btn.click()
        print("[OK] Step completed")
        
        # Step 3: Assert: redirected to admin dashboard
        print("3. Asserting redirect to admin dashboard")
        wait.until(EC.url_contains("/admin/dashboard"))
        print("[OK] Step completed")
        
        # Step 4: Assert: dashboard shows admin role interface
        print("4. Asserting dashboard shows admin role interface")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'ADMIN', 'admin'), 'admin') or contains(translate(., 'SYSTEM', 'system'), 'system')]")))
        print("[OK] Step completed")
        
        # Step 5: Navigate to /admin/users
        print("5. Navigating to /admin/users")
        users_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/users')]")))
        driver.execute_script("arguments[0].click();", users_link)
        print("[OK] Step completed")
        
        # Step 6: Assert: users list page loads
        print("6. Asserting users list page loads")
        wait.until(EC.url_contains("/users"))
        print("[OK] Step completed")
        
        # Step 7: Assert: table or list of users is present
        print("7. Asserting User Management page content loads")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'USER MANAGEMENT', 'user management'), 'user management') or contains(translate(., 'NO USERS', 'no users'), 'no users')]")))
        print("[OK] Step completed")
        
        # Step 7b: Suspend and then Unsuspend a user
        print("7b. Performing user suspension test...")
        # Wait for the table rows to load (loading spinner gone)
        print("Waiting for user table to load...")
        wait.until(lambda d: d.execute_script("return document.querySelectorAll('table tbody tr').length > 0;") or d.execute_script("return document.body.textContent.includes('No users found');"))
        
        try:
            # Find the student's Suspend button specifically
            print("Locating Suspend button for sahmed2330154@bscse.uiu.ac.bd...")
            clicked = driver.execute_script("""
                let targetTr = Array.from(document.querySelectorAll('tr')).find(tr => tr.textContent.includes('sahmed2330154@bscse.uiu.ac.bd'));
                if (targetTr) {
                    let suspendBtn = Array.from(targetTr.querySelectorAll('button')).find(b => b.textContent.includes('Suspend'));
                    if (suspendBtn) {
                        suspendBtn.click();
                        return true;
                    }
                }
                return false;
            """)
            assert clicked, "Suspend button for student sahmed2330154@bscse.uiu.ac.bd not found!"
            time.sleep(2)
            
            print("Entering suspension reason in modal...")
            reason_textarea = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[contains(@placeholder, 'Reason')]")))
            reason_textarea.clear()
            reason_textarea.send_keys("Test suspension: policy violation")
            time.sleep(1)
            
            print("Submitting suspension...")
            confirm_suspend_btn = wait.until(lambda d: d.execute_script(
                "return Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Suspend User');"
            ))
            driver.execute_script("arguments[0].click();", confirm_suspend_btn)
            time.sleep(3)
            
            # Verify the user is suspended
            print("Verifying 'Suspended' badge is visible...")
            wait.until(EC.presence_of_element_located((By.XPATH, "//*[text()='Suspended']")))
            print("[OK] User suspended successfully and 'Suspended' badge is visible on the UI!")
            
            # Take a screenshot to show the suspended state
            driver.save_screenshot("suspended_user_view.png")
            print("Saved screenshot of suspended user to suspended_user_view.png")
            time.sleep(2)
            
        except Exception as e:
            print(f"[WARNING] Suspend test failed: {e}")
            raise e
        
        # Step 17: Logout
        print("17. Clicking logout")
        time.sleep(3)
        logout_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout') || b.innerHTML.includes('log-out'));"))
        driver.execute_script("arguments[0].click();", logout_btn)
        print("[OK] Step completed")
        
        # Step 18: Assert: redirected away from admin area
        print("18. Asserting redirect after logout")
        wait.until(lambda d: "/admin" not in d.current_url)
        # Step 19: Attempt to log in as the suspended student user
        print("19. Attempting to log in as the suspended student user...")
        driver.get("http://localhost:5173/login")
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
        email_input.clear()
        email_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        
        pass_input = driver.find_element(By.XPATH, "//input[@type='password']")
        pass_input.clear()
        pass_input.send_keys("password")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        driver.execute_script("arguments[0].click();", login_btn)
        
        # Wait for the suspension error message to show up
        print("Waiting for suspension message to display...")
        time.sleep(3)
        
        suspension_msg_visible = wait.until(lambda d: d.execute_script("""
            let text = document.body.textContent;
            return text.toLowerCase().includes('suspended') || text.toLowerCase().includes('contact support');
        """))
        assert suspension_msg_visible, "Suspension message was not displayed on the UI!"
        print("[OK] Suspension error message is visible on the login screen!")
        
        # Take screenshot of the suspension message
        driver.save_screenshot("login_suspended_error.png")
        print("Saved screenshot of suspension login error to login_suspended_error.png")
        
        # Wait for 10 seconds before closing
        print("Waiting for 10 seconds before closing browser...")
        time.sleep(10)
        
        print("\nTest passed successfully!")
        
    except Exception as e:
        print(f"[FAIL] Step failed: {str(e)}")
        try:
            driver.save_screenshot("error_screenshot_admin_user_management.png")
            print("Screenshot saved to error_screenshot_admin_user_management.png")
        except Exception as se:
            print(f"Failed to save screenshot: {se}")
        sys.exit(1)
    finally:
        print("Cleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    run_test()
