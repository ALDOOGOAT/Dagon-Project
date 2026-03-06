import requests
import sys

def test_specific_registration():
    """Test the specific registration case mentioned in the request"""
    base_url = "https://dagon-sql.preview.emergentagent.com"
    
    # Test registration with specific credentials
    test_data = {
        "email": "test_final@dagon.com",
        "password": "test123",
        "name": "Usuario Test"
    }
    
    print("🔍 Testing specific registration: test_final@dagon.com")
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            print(f"✅ Registration successful!")
            print(f"   User: {user.get('name')} ({user.get('email')})")
            print(f"   Level: {user.get('level')}")
            return token
        elif response.status_code == 400:
            print("⚠️  User already exists, trying login...")
            # Try login instead
            login_data = {
                "email": "test_final@dagon.com",
                "password": "test123"
            }
            
            login_response = requests.post(
                f"{base_url}/api/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                token = data.get('token')
                user = data.get('user')
                print(f"✅ Login successful!")
                print(f"   User: {user.get('name')} ({user.get('email')})")
                print(f"   Level: {user.get('level')}")
                return token
            else:
                print(f"❌ Login failed: {login_response.status_code}")
                return None
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    token = test_specific_registration()
    if token:
        print(f"\n✅ Authentication successful! Token: {token[:20]}...")
        sys.exit(0)
    else:
        print("\n❌ Authentication failed!")
        sys.exit(1)