import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";


export async function getRecommendedUsers(req, res) {
    // “In my chat app project, I implemented a getRecommendedUsers controller that fetches potential new connections for the logged-in user. It filters out the current user, their existing friends, and ensures only onboarded users are suggested. I used MongoDB query operators like $ne and $nin for filtering, combined with a secure JWT-based authentication system that provides req.user.”
    try {
        const currentUserId = req.user.id;
        const currentUser = req.user;

        const recommendUsers = await User.find({
            $and: [
                { _id: { $ne: currentUserId } },// It filters out the currently logged-in user themselves So you don’t see your own profile in the recommendations
                { $id: { $nin: currentUser.friends } },//exclude current users friend
                { isOnboarded: true }, // who completed their profile
            ],
        });
        res.status(200).json(recommendUsers);
    } catch (error) {
        console.error("Error in fetRecommendedUSers controllers", error.message);
        res.status(500).json({ message: "Internal Server Error" });

    }
}
export async function getMyFriends(req, res) {
    // “I implemented a getMyFriends endpoint that fetches the logged-in user’s friend list. It uses Mongoose’s populate() method to replace friend IDs with actual user documents, selecting only the relevant fields for performance optimization. This helps display each friend’s profile details efficiently in the frontend.”
    try {
        const user = await User.findById(req.user.id)
            .select("friends") //This tells MongoDB to only retrieve the friends field from the user document not other fields like email or password.
            .populate("friends", "fullname", "profilePic", "nativeLanguage, learningLanguage");

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getMyfriends controller", error.message);
        res.status(500).json({ message: "Internal Server error" });
    }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user.id;
        const { id: recipientId } = req.params;

        // prevent sending req to yourself
        if (myId === recipientId) {
            return res.status(400).json({ message: "You can't send  friend request to yourself" });
        }
        const recipient = await User.findById(recipientId)
        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }
        //check if user is already friends
        if (recipient.friends.includes(myId)) {
            return res.status(400).json({ message: " you are already friends with this user" });
        }

        //check of a req is already friends
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId },
            ],
        })

        if (existingRequest) {
            return res.status(400).json({ message: "A friend request already exists between you and this user" });
        }

        //create 
        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId,
        });
        res.status(201).json(friendRequest);
    } catch (error) {
        console.error("Error in sendingFriendRequest constroller".error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function acceptFriendRequest(req, res) {
    try {
        const { id: requestId } = req.params;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(400).json({ message: "Friend request not found" });
        }

        // verify the curent user is the recipient
        if (friendRequest.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: " you are not authorized to accept this request" });

        }
        friendRequest.status = "accepted";
        await friendRequest.save();

        //add each user to the other's friend array
        // $addtoset add a elemnt to an array only if they do not already exist
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient },
        });
        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender },
        });
        return res.status(200).json({ message: "Friend request accepted" });

    } catch (error) {
        console.log("Error in acceptFriendRequest controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });

    }
}

export async function getFriendRequests(req, res) {
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending",
        }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqs = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient", "fullName profilePic");

        res.status(200).json({ incomingReqs, acceptedReqs });
    } catch (error) {
        console.log("Error in getPendingFriendRequests controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export async function getOutgoingFriendReqs(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.log("Error in getOutgoingFriendReqs controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}