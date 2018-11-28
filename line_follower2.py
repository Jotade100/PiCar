#!/usr/bin/env python
'''
**********************************************************************
* Filename    : line_follower
* Description : An example for sensor car kit to followe line
* Author      : Dream
* Brand       : SunFounder
* E-mail      : service@sunfounder.com
* Website     : www.sunfounder.com
* Update      : Dream    2016-09-21    New release
**********************************************************************
'''

from SunFounder_Line_Follower import Line_Follower
from picar import front_wheels
from picar import back_wheels
import time
import picar
import requests
import json
picar.setup()

REFERENCES = [241, 260, 267, 260, 244]
#calibrate = True
calibrate = False
forward_speed = 80
backward_speed = 70
turning_angle = 40
status_temp = [98,1,61,1,1]

max_off_track_count = 40

delay = 0.0005

fw = front_wheels.Front_Wheels(db='config')
bw = back_wheels.Back_Wheels(db='config')
lf = Line_Follower.Line_Follower()

lf.references = REFERENCES
fw.ready()
bw.ready()
fw.turning_max = 45

def straight_run():
	while True:
		bw.speed = 70
		bw.forward()
		fw.turn_straight()

def setup():
	if calibrate:
		cali()

def main():
	global turning_angle, status_temp
	off_track_count = 0
	bw.speed = forward_speed

	a_step = 3
	b_step = 10
	c_step = 30
	d_step = 45
	bw.forward()
	while True:
		encendido = requests.get("http://192.168.43.52:8080/encendido")
		manejo = requests.get("http://192.168.43.52:8080/move")
 
		print(encendido)
		lt_status_now = lf.read_digital()
		if not status_temp == lt_status_now:
			print lt_status_now
			r = requests.post("http://192.168.43.52:8080/sensores", data={"status":lt_status_now})
		status_temp = lt_status_now
		t = requests.get("http://192.168.43.52:8080/encendido")
    		while t.content == "false":
			bw.speed = 0 
			bw.forward()
			r = requests.post("http://192.168.43.52:8080/estado", data=json.dumps({"mov":"stop", "vel":0}),  headers={'content-type': 'application/json'})
			t = requests.get("http://192.168.43.52:8080/encendido")
		bw.speed = forward_speed
		bw.forward()
		step = 0
		# Angle calculate
		if	lt_status_now == [0,0,1,0,0]:
			step = 0
		elif lt_status_now == [0,1,1,0,0] or lt_status_now == [0,0,1,1,0]:
			step = a_step
		elif lt_status_now == [0,1,0,0,0] or lt_status_now == [0,0,0,1,0]:
			step = b_step
		elif lt_status_now == [1,1,0,0,0] or lt_status_now == [0,0,0,1,1]:
			step = c_step
		elif lt_status_now == [1,0,0,0,0] or lt_status_now == [0,0,0,0,1]:
			step = d_step

		manejo = requests.get("http://192.168.43.52:8080/move")
                while int(manejo.content) > 0:
                        control(int(manejo.content), step)
                        manejo = requests.get("http://192.168.43.52:8080/move")


		# Direction calculate
		if	lt_status_now == [0,0,1,0,0]:
			off_track_count = 0
			fw.turn(90)
		# turn right
		elif lt_status_now in ([0,1,1,0,0],[0,1,0,0,0],[1,1,0,0,0],[1,0,0,0,0]):
			off_track_count = 0
			turning_angle = int(90 - step)
		# turn left
		elif lt_status_now in ([0,0,1,1,0],[0,0,0,1,0],[0,0,0,1,1],[0,0,0,0,1]):
			off_track_count = 0
			turning_angle = int(90 + step)

		elif lt_status_now == [0,0,0,0,0]:
			off_track_count += 1
			if off_track_count > max_off_track_count:
				#tmp_angle = -(turning_angle - 90) + 90
				tmp_angle = (turning_angle-90)/abs(90-turning_angle)
				tmp_angle *= fw.turning_max
				bw.speed = backward_speed
				bw.backward()
				fw.turn(tmp_angle)
				lf.wait_tile_center()
				bw.stop()

				fw.turn(turning_angle)
				time.sleep(0.2)
				bw.speed = forward_speed
				bw.forward()
				time.sleep(0.2)
					

		else:
			off_track_count = 0
	
		fw.turn(turning_angle)
		time.sleep(delay)

def cali():
	references = [0, 0, 0, 0, 0]
	print "cali for module:\n  first put all sensors on white, then put all sensors on black"
	mount = 100
	fw.turn(70)
	print "\n cali white"
	time.sleep(4)
	fw.turn(90)
	white_references = lf.get_average(mount)
	fw.turn(95)
	time.sleep(0.5)
	fw.turn(85)
	time.sleep(0.5)
	fw.turn(90)
	time.sleep(1)

	fw.turn(110)
	print "\n cali black"
	time.sleep(4)
	fw.turn(90)
	black_references = lf.get_average(mount)
	fw.turn(95)
	time.sleep(0.5)
	fw.turn(85)
	time.sleep(0.5)
	fw.turn(90)
	time.sleep(1)

	for i in range(0, 5):
		references[i] = (white_references[i] + black_references[i]) / 2
	lf.references = references
	print "Middle references =", references
	time.sleep(1)

def destroy():
	r = requests.post("http://192.168.43.52:8080/estado", data=json.dumps({"mov":"stop", "vel":0}),  headers={'content-type': 'application/json'})
	bw.stop()
	fw.turn(90)

def control(accion, steps):
       # while true:
       # r = requests.get("http://192.168.43.52:8080/move")
        if accion == 1:
		fw.turn(90)
		print("UP")
                bw.speed = 60
                bw.forward()
        elif accion == 4:
		print("RIGHT")
                bw.speed = 50
                turning_angle = int(90 - steps)
                fw.turn(40)
        elif accion == 3:
		print("LEFT")
                bw.speed = 50
                turning_angle = int(90 + steps)
                fw.turn(110)
        elif accion == 2:
		fw.turn(90)
		print("DOWN")
                bw.speed = 50
                bw.backward()




if __name__ == '__main__':
	try:
		try:
			while True:
				setup()
				r = requests.post("http://192.168.43.52:8080/estado", data=json.dumps({"mov":"running", "vel":55}),  headers={'content-type': 'application/json'})
				main()
				y = []
				#straight_run(),
		except Exception,e:
			print e
			print 'error try again in 5'
			destroy()
			time.sleep(5)
	except KeyboardInterrupt:
		destroy()

