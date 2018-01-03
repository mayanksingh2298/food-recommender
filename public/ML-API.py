import urllib2
import json

data = {
        "Inputs": {
                "input1":
                [
                    {
                     "Air Conditioned": "1", 
                     "American": "2", 
                     "Asian": "0", 
                     "Barbeque and Grill": "0", 
                     "Cards Accepted": "1", 
                     "Chinese": "2", 
                     "Coastal": "0", 
                     "Coffee": "0", 
                     "Continental": "0", 
                     "DJ": "1", 
                     "Dance Floor": "1", 
                     "Differently Abled Friendly": "0", 
                     "Fast Food": "0", 
                     "Games": "0", 
                     "Health Food": "0", 
                     "Home Delivery": "1", 
                     "Hookah": "1", 
                     "Italian": "2", 
                     "Japanese": "0", 
                     "Lebanese": "0", 
                     "Lift": "1", 
                     "Malaysian": "0", 
                     "Mediterranean": "0", 
                     "Mexican": "0", 
                     "Mughlai": "0", 
                     "Multi-Cuisine": "0", 
                     "North Indian": "2", 
                     "Oriental": "0", 
                     "Outdoor Seating": "1", 
                     "Parking": "0", 
                     "Roof Top": "1", 
                     "Seafood": "0", 
                     "Smoking Area": "1", 
                     "Take Away": "1", 
                     "Thai": "0", 
                     "Wifi": "0",
                     "Rating": "5"
                  }
                ],
                "input2":
                [
                    {
                     "Air Conditioned": "1", 
                     "American": "2", 
                     "Asian": "2", 
                     "Barbeque and Grill": "0", 
                     "Cards Accepted": "0", 
                     "Chinese": "2", 
                     "Coastal": "0", 
                     "Coffee": "1", 
                     "Continental": "0", 
                     "DJ": "1", 
                     "Dance Floor": "1", 
                     "Differently Abled Friendly": "1", 
                     "Fast Food": "0", 
                     "Games": "0", 
                     "Health Food": "0", 
                     "Home Delivery": "1", 
                     "Hookah": "1", 
                     "Italian": "2", 
                     "Japanese": "0", 
                     "Lebanese": "0", 
                     "Lift": "1", 
                     "Malaysian": "0", 
                     "Mediterranean": "0", 
                     "Mexican": "0", 
                     "Mughlai": "0", 
                     "Multi-Cuisine": "0", 
                     "North Indian": "0", 
                     "Oriental": "0", 
                     "Outdoor Seating": "1", 
                     "Parking": "0", 
                     "Roof Top": "1", 
                     "Seafood": "0", 
                     "Smoking Area": "1", 
                     "Take Away": "0", 
                     "Thai": "0", 
                     "Wifi": "0"
                  }
                ],
        },
    "GlobalParameters":  {
    }
}

body = str.encode(json.dumps(data))

url = 'https://ussouthcentral.services.azureml.net/workspaces/28e0446f7f3f475083aef3186ce5e9b1/services/23160a643d124e87974fee18d2572197/execute?api-version=2.0&format=swagger'
api_key = 'H36SNAlOQpz19IIIAcgFcbO6nrSdFrk8ieqMe/QIi3+dqx66tyqJyM36Ykm4Ua0QuRlc8WFqLuNnEG9vQiSzTA==' # Replace this with the API key for the web service
headers = {'Content-Type':'application/json', 'Authorization':('Bearer '+ api_key)}

req = urllib2.Request(url, body, headers)

try:
    response = urllib2.urlopen(req)

    result = response.read()
    print(result)
except urllib2.HTTPError, error:
    print("The request failed with status code: " + str(error.code))

    # Print the headers - they include the requert ID and the timestamp, which are useful for debugging the failure
    print(error.info())
    print(json.loads(error.read()))