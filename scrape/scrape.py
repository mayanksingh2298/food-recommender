import requests
from BeautifulSoup import BeautifulSoup
import json

listOfUrls=["https://www.dineout.co.in/delhi/crazy-kitchen-rooftop-lounge-satya-niketan-south-delhi-22357",
"https://www.dineout.co.in/delhi/the-construction-co-cafe-satya-niketan-south-delhi-34490",
"https://www.dineout.co.in/delhi/queens-boulevard-lajpat-nagar-4-south-delhi-29341",
"https://www.dineout.co.in/delhi/like-italy-greater-kailash-1-south-delhi-37319",
"https://www.dineout.co.in/delhi/the-kylin-experience-greater-kailash-1-south-delhi-35325",
"https://www.dineout.co.in/delhi/cafe-mechanix-satya-niketan-south-delhi-37698",
"https://www.dineout.co.in/delhi/achulas-kitchen-satya-niketan-south-delhi-37701",
"https://www.dineout.co.in/delhi/french-kiss-cafe-lajpat-nagar-4-south-delhi-37572",
"https://www.dineout.co.in/delhi/uncultured-cafe-bar-kailash-colony-south-delhi-32441",
"https://www.dineout.co.in/delhi/caf-healthilicious-greater-kailash-1-south-delhi-33952",
"https://www.dineout.co.in/delhi/lodi-the-garden-restaurant-lodhi-road-south-delhi-312",
"https://www.dineout.co.in/delhi/1-oak-cafe-bar-defence-colony-south-delhi-666",
"https://www.dineout.co.in/delhi/the-flying-saucer-nehru-place-south-delhi-543",
"https://www.dineout.co.in/delhi/lord-of-the-drinks-forum-nehru-place-south-delhi-22382",
"https://www.dineout.co.in/delhi/lord-of-the-drinks-meadow-hauz-khas-village-south-delhi-29426",
"https://www.dineout.co.in/delhi/3-pegs-down-saket-south-delhi-20874",
"https://www.dineout.co.in/delhi/off-campus-satya-niketan-south-delhi-23092",
"https://www.dineout.co.in/delhi/laidback-cafe-saket-south-delhi-35021",
"https://www.dineout.co.in/delhi/setz-vasant-kunj-south-delhi-645",
"https://www.dineout.co.in/delhi/the-junction-hauz-khas-south-delhi-30691",
"https://www.dineout.co.in/delhi/lazeez-affaire-chanakyapuri-south-delhi-109",
"https://www.dineout.co.in/delhi/fio-country-kitchen-and-bar-saket-south-delhi-143",
"https://www.dineout.co.in/delhi/smoke-house-deli-vasant-kunj-south-delhi-258",
"https://www.dineout.co.in/delhi/taksim-khel-gaon-south-delhi-29626",
"https://www.dineout.co.in/delhi/olive-bar-kitchen-mehrauli-south-delhi-78",
"https://www.dineout.co.in/delhi/desi-vibes-defence-colony-south-delhi-24863",
"https://www.dineout.co.in/delhi/chilis-american-grill-bar-saket-south-delhi-19060",
"https://www.dineout.co.in/delhi/auro-kitchen-bar-hauz-khas-south-delhi-28441",
"https://www.dineout.co.in/delhi/barbeque-nation-jungpura-south-delhi-8845",
"https://www.dineout.co.in/delhi/summer-house-cafe-hauz-khas-south-delhi-633",
"https://www.dineout.co.in/delhi/nehru-place-social-nehru-place-south-delhi-22375",
"https://www.dineout.co.in/delhi/chilis-american-grill-bar-vasant-kunj-south-delhi-7570",
"https://www.dineout.co.in/delhi/cafe-delhi-heights-vasant-kunj-south-delhi-15246",
"https://www.dineout.co.in/delhi/trend-bar-kitchen-khel-gaon-south-delhi-33480",
"https://www.dineout.co.in/delhi/punjabi-by-nature-bar-exchange-vasant-kunj-south-delhi-11174",
"https://www.dineout.co.in/delhi/shalom-s-bar-restaurant-greater-kailash-1-south-delhi-216",
"https://www.dineout.co.in/delhi/in-the-punjab-greater-kailash-1-south-delhi-566",
"https://www.dineout.co.in/delhi/sana-di-ge-chanakyapuri-south-delhi-21500",
"https://www.dineout.co.in/delhi/cafe-delhi-heights-saket-south-delhi-18327",
"https://www.dineout.co.in/delhi/kylin-sky-bar-vasant-kunj-south-delhi-4871",
#add more urls for more outlets
#These are the first two pages from https://www.dineout.co.in/delhi-restaurants/south-delhi
]

featureToInt2={
	"Smoking Area":0,
	"Air Conditioned":1,
	"DJ":2,
	"Lift":3,
	"Home Delivery":4,
	"Take Away":5,
	"Cards Accepted":6,
	"Differently Abled Friendly":7,
	"Dance Floor":8,
	"Hookah":9,
	"Outdoor Seating":10,
	"Roof Top":11,
	"Parking":12,
	"Games":13,
	"Barbeque and Grill":14,
	"North Indian":15,
	"Italian":16,
	"Chinese":17,
	"American":18,
	"Multi-Cuisine":19,
	"Mughlai":20,
	"Asian":21,
	"Mexican":22,
	"Continental":23,
	"Health Food":24,
	"Coffee":25,
	"Mediterranean":26,
	"Fast Food":27,
	"Thai":28,
	"Coastal":29,
	"Oriental":30,
	"Seafood":31,
	"Japanese":32,
	"Malaysian":33,
	"Lebanese":34,
	"Wifi":35
	#the feature vector to be done
}
featureToInt={
	"Smoking Area":"0",
	"Air Conditioned":"0",
	"DJ":"0",
	"Lift":"0",
	"Home Delivery":"0",
	"Take Away":"0",
	"Cards Accepted":"0",
	"Differently Abled Friendly":"0",
	"Dance Floor":"0",
	"Hookah":"0",
	"Outdoor Seating":"0",
	"Roof Top":"0",
	"Parking":"0",
	"Games":"0",
	"Barbeque and Grill":"0",
	"North Indian":"0",
	"Italian":"0",
	"Chinese":"0",
	"American":"0",
	"Multi-Cuisine":"0",
	"Mughlai":"0",
	"Asian":"0",
	"Mexican":"0",
	"Continental":"0",
	"Health Food":"0",
	"Coffee":"0",
	"Mediterranean":"0",
	"Fast Food":"0",
	"Thai":"0",
	"Coastal":"0",
	"Oriental":"0",
	"Seafood":"0",
	"Japanese":"0",
	"Malaysian":"0",
	"Lebanese":"0",
	"Wifi":"0"
	#the feature vector to be done
}
featureLength=36


totalDic=[]
ind=0
for url in listOfUrls:
	# print ind
	response = requests.get(url)
	html = response.content

	soup = BeautifulSoup(html)
	#soup.find(id="info").prettify()
	dic={}
	dic["id"]=ind
	# for i in range(32):
	dic["name"]=soup.findAll("h1",{'class':"restnt-name"})[0].text
	dic["img"]=soup.findAll("img",{'class':"no-img"})[-1]["src"]
	dic["address"]=soup.findAll("span",{'class':"address-info"})[0].text
	mapaddrs=str(soup.findAll("a",{'class':"view-all-link pull-right marginT5"})[0]["href"])
	dic["map"]=mapaddrs
	dic["lat,long"]=mapaddrs[mapaddrs.index("=")+1:]
	dic["phone"]=soup.findAll("div",{'class':"phone-number"})[0].text
	costfortwo = str(soup.findAll("div",{'class':"fs16 marginB5"})[0].text)
	dic["costfortwo"]=costfortwo[1+costfortwo.index(" "):costfortwo.index("f")]
	dic["about"]=soup.findAll("div",{'class':"rightDiv desc-wrap col-sm-9"})[0].text

	dic["cuisine"]=soup.findAll("div",{'class':"cuisine-type"})[0].text
	featureList = soup.findAll("div",{'class':"rightDiv features-wrap col-sm-9"})[0].ul.findAll("li")
	features = []
	for i in featureList:
		features.append(str(i.text))
	features.pop()
	dic["features"]=str(features)

	#to develop the feature vector
	featureVector=dict(featureToInt)
	
	for i in features:
		if i in featureToInt:
			featureVector[i]="1"
	for i in dic["cuisine"].split(","):
		if i in featureToInt:
			featureVector[i]="2"
	dic["featureVector"]=featureVector

	totalDic.append(dic)

	# json_string = json.dumps(dic)

	# print json_string
	ind+=1
json_string = json.dumps(totalDic, indent=3, sort_keys=True)
print json_string
# print totalDic



