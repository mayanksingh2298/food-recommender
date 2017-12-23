import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
rng = np.random

learning_rate = 0.01
training_epochs = 1000
display_step = 50

# Let's say there are 5 food items[spicy, sweet] and one user
Y_userrating = np.asarray([[[5]],[[4]],[[4]],[[1]],[[2]]])
X_movietype = np.asarray([[[8],[2]],[[9],[3]],[[10],[3]],[[5],[7]],[[3],[8]]])

n = X_movietype.shape[0]

#placeholders for input and output
X = tf.placeholder(tf.float32,shape=(2,1))
Y = tf.placeholder("float",shape=(1,1))

#Set model weights
W = tf.get_variable("weight",(1,2), initializer=tf.contrib.layers.xavier_initializer())
b = tf.get_variable("bias", (1,1), initializer=tf.contrib.layers.xavier_initializer())

#Construct a linear model
pred = tf.matmul(W,X)+b

#Mean squarred error
cost = tf.reduce_sum(tf.pow(pred-Y,2)/(2*n))

#Gradient Descent
optimizer = tf.train.GradientDescentOptimizer(learning_rate).minimize(cost)

#initialize global variables
init = tf.global_variables_initializer()

#Start training
with tf.Session() as sess:
	#Run the initializer
	sess.run(init)

	#Fit all training data
	graphX=[]
	graphY=[]
	for epoch in range(training_epochs):
		epoch_cost = 0
		for(x,y) in zip(X_movietype,Y_userrating):
			_ , c = sess.run([optimizer, cost], feed_dict={X:x,Y:y})
			epoch_cost += c
		#Display the log sometimes
		graphX.append(epoch+1)
		graphY.append(epoch_cost)
		if (epoch+1) % display_step == 0:
			print("Epoch:", '%04d' % (epoch+1), "cost=", "{:.9f}".format(epoch_cost), "W=", sess.run(W), "b=", sess.run(b))

	print "Optimization finished"
	# training_cost = sess.run(cost, feed_dict={X:X_movietype,Y:Y_userrating})
	# print("Training cost=", training_cost, "W=", sess.run(W), "b=", sess.run(b), '\n')

	# Graph display
	plt.plot(graphX[10:], graphY[10:], 'ro', label='Cost with iterations')
	plt.legend()
	# plt.show()

	#Test phase
	print "Testing..."
	X_test = np.asarray([[5],[6]])
	testing_rating = sess.run(pred,feed_dict={X: X_test})  # same function as cost above
	print "Testing rating="+ str(testing_rating)