#This is how you call my API using python, you may also call my API from any other language
import urllib2
import json

data = {
        "Inputs": {
                "input1":#input1 is an array, used for training the algo
                [
                    {
                            'Indian': "10",   
                            'Chinese': "4",   
                            'Italian': "3",   
                            'Smoke': "1",   
                            'AC': "8",   
                            'drink': "1",   
                            'Rating': "5",   
                    },
                    {
                            'Indian': "1",   
                            'Chinese': "6",   
                            'Italian': "7",   
                            'Smoke': "8",   
                            'AC': "10",   
                            'drink': "9",   
                            'Rating': "1",   
                    },
                    {
                            'Indian': "7",   
                            'Chinese': "8",   
                            'Italian': "7",   
                            'Smoke': "10",   
                            'AC': "8",   
                            'drink': "9",   
                            'Rating': "2",   
                    },
                ],
                "input2":#input2 is used for testing the algo
                [
                    {
                            'Indian': "8",   
                            'Chinese': "2",   
                            'Italian': "3",   
                            'Smoke': "1",   
                            'AC': "7",   
                            'drink': "1",   
                    },
                    {
                            'Indian': "3",   
                            'Chinese': "6",   
                            'Italian': "7",   
                            'Smoke': "7",   
                            'AC': "7",   
                            'drink': "7",   
                    },
                    {
                            'Indian': "8",   
                            'Chinese': "5",   
                            'Italian': "6",   
                            'Smoke': "8",   
                            'AC': "10",   
                            'drink': "9",   
                    },
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
