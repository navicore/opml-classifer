let chai = require('chai')
chai.should() //tell chai to support 'should'

describe('test1', () => {
  describe('#val', () => {
    let one
    beforeEach(() => {
      one = {val: 2, note: 'hiya'}
    })
    it('should have 2', () => {
      one.val.should.equal(2)
    })
    it('should say hiya', () => {
      one.note.should.equal('hiya')
    })
  })
})

