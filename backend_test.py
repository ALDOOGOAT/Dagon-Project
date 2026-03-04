import requests
import sys
import json
from datetime import datetime
import uuid

class DagonAPITester:
    def __init__(self, base_url="https://dagon-sql.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = str(uuid.uuid4())

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:500]}")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test{timestamp}@dagon.com",
            "password": "test123",
            "name": "Usuario Prueba"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token received: {self.token[:20]}...")
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        test_data = {
            "email": "test@dagon.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Login token: {self.token[:20]}...")
            return True
        return False

    def test_get_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "api/user/profile",
            200
        )
        
        if success:
            expected_fields = ['id', 'email', 'name', 'xp', 'streak', 'level']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   ✅ All profile fields present")
                print(f"   User: {response.get('name')} | XP: {response.get('xp')} | Level: {response.get('level')}")
        
        return success

    def test_get_levels(self):
        """Test getting available levels"""
        success, response = self.run_test(
            "Get Levels",
            "GET",
            "api/levels",
            200
        )
        
        if success and 'levels' in response:
            levels = response['levels']
            print(f"   Found {len(levels)} levels")
            for level in levels:
                print(f"   - {level.get('name')} (ID: {level.get('id')})")
            return len(levels) == 5  # Should have 5 levels
        return False

    def test_get_exercises(self, level_id):
        """Test getting exercises for a specific level"""
        success, response = self.run_test(
            f"Get Exercises for {level_id}",
            "GET",
            f"api/exercises/{level_id}",
            200
        )
        
        if success and 'exercises' in response:
            exercises = response['exercises']
            print(f"   Found {len(exercises)} exercises for {level_id}")
            if exercises:
                exercise = exercises[0]
                print(f"   First exercise: {exercise.get('title')} (Type: {exercise.get('type')})")
                return exercise.get('id')  # Return first exercise ID for validation test
        return None

    def test_validate_exercise(self, level_id, exercise_id, query):
        """Test exercise validation"""
        test_data = {
            "exercise_id": exercise_id,
            "query": query,
            "level_id": level_id
        }
        
        success, response = self.run_test(
            f"Validate Exercise {exercise_id}",
            "POST",
            "api/exercises/validate",
            200,
            data=test_data
        )
        
        if success:
            print(f"   Success: {response.get('success')}")
            print(f"   Message: {response.get('message')}")
            print(f"   XP Gained: {response.get('xp_gained', 0)}")
        
        return success

    def test_chat_clawbot(self):
        """Test Clawbot chat functionality"""
        test_data = {
            "message": "¿Qué es SELECT en SQL?",
            "session_id": self.session_id
        }
        
        success, response = self.run_test(
            "Chat with Clawbot",
            "POST",
            "api/chat",
            200,
            data=test_data
        )
        
        if success and 'response' in response:
            chat_response = response['response']
            print(f"   Clawbot response length: {len(chat_response)} characters")
            print(f"   Response preview: {chat_response[:100]}...")
            return True
        return False

    def test_chat_clawbot_followup(self):
        """Test Clawbot follow-up conversation"""
        test_data = {
            "message": "Explícame JOIN",
            "session_id": self.session_id  # Same session for continuity
        }
        
        success, response = self.run_test(
            "Chat Follow-up with Clawbot",
            "POST",
            "api/chat",
            200,
            data=test_data
        )
        
        if success and 'response' in response:
            chat_response = response['response']
            print(f"   Follow-up response length: {len(chat_response)} characters")
            print(f"   Response preview: {chat_response[:100]}...")
            return True
        return False

def main():
    print("🔴 Starting Dagon API Testing...")
    print("=" * 50)
    
    tester = DagonAPITester()
    
    # Test registration first
    if not tester.test_register():
        print("❌ Registration failed, trying login with existing user...")
        if not tester.test_login():
            print("❌ Both registration and login failed, stopping tests")
            return 1
    
    # Test authenticated endpoints
    tester.test_get_profile()
    
    # Test levels and exercises
    if tester.test_get_levels():
        # Test exercises for each level
        levels_to_test = ["nivel-0", "basico", "medio", "avanzado", "pro"]
        
        for level_id in levels_to_test:
            exercise_id = tester.test_get_exercises(level_id)
            
            if exercise_id:
                # Test validation with correct query for drag-drop exercises
                if level_id in ["nivel-0", "basico"]:
                    if level_id == "nivel-0":
                        test_query = "SELECT * FROM usuarios"
                    else:  # basico
                        test_query = "SELECT * FROM usuarios WHERE edad > 18"
                    
                    tester.test_validate_exercise(level_id, exercise_id, test_query)
                else:
                    # For advanced levels, test with a simple SELECT
                    tester.test_validate_exercise(level_id, exercise_id, "SELECT * FROM tabla")
    
    # Test Clawbot chat
    tester.test_chat_clawbot()
    tester.test_chat_clawbot_followup()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())